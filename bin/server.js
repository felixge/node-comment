#!/usr/bin/env node
require('../lib/bootstrap');

var
  config = require('config/default'),
  fab = require('dep/fab'),
  http = require('http'),
  middleware = {
    auth: require('dep/fab-basic-auth').fabware,
    json: require('dep/fab-json').fabware,
    paperboy: require('dep/node-paperboy').fabware,
  },

  comments = [],
  commentListeners = [],
  db =
    require('dep/node-couchdb')
    .createClient(config.couchDb.port, config.couchDb.host)
    .db(config.couchDb.db);

http.createServer(
  (fab)
    (middleware.json('callback'))
    (middleware.paperboy('public'))
    ('/comments')
      ['GET'](function(respond) {
        return deliverComments.call(this, respond, 'approved');
      })
      ('/add', function(respond) {
        var text = this.url.query && this.url.query.text;
        if (!text) {
          return {
            status: 400,
            body: {error: 'No ?text= parameter was given'},
          };
        }

        db
          .saveDoc({
            type: 'Comment',
            text: text,
            time: +new Date,
            // status: 'approved',
            status: 'awaiting_response',
          })
          .addCallback(function(r) {
            respond({
              status: 200,
              body: {ok: true, id: r.id, rev: r.rev},
            });
            // finish the request, filed a bug for this here: 
            // http://github.com/jed/fab/issues#issue/1
            respond(null);
          })
          .addErrback(function(e) {
            respond({
              status: 500,
              body: {error: e},
            });
            respond(null);
          });
      })
    ()
    ('/admin')
      (middleware.auth('admin', 'test', 'Admin Area'))
      ('/comments')
        ['GET'](function(respond) {
          return deliverComments.call(this, respond);
        })
        ('/update', function(respond) {
          if (!this.url.query || !this.url.query.id) {
            return {
              status: 400,
              body: {error: 'No ?id= parameter was given'},
            };
          }

          var
            action = this.url.query.action,
            setStatus;
          if (action == 'publish') {
            setStatus = 'approved';
          } else if (action == 'spam') {
            setStatus = 'spam';
          }

          if (!setStatus) {
            return {
              status: 400,
              body: {error: 'Known ?action='+action+' parameter was given'},
            };
          }

          db
            .getDoc(this.url.query.id)
            .addCallback(function(doc) {
              doc.status = setStatus;
              db
                .saveDoc(doc)
                .addCallback(function() {
                  respond({
                    status: 200,
                    body: {ok: true},
                  });
                  respond(null);
                })
                .addErrback(function(e) {
                  respond({
                    status: 500,
                    body: {error: e},
                  });
                  respond(null);
                });
            })
            .addErrback(function() {
              respond({
                status: 404,
                body: {error: 'Could not find doc with id: '+this.query.id},
              });
              respond(null);
            });
        })
        ('/flush')
          ['POST'](function(respond) {
            db
              .remove()
              .addErrback(function() {});
            db
              .create()
              .addCallback(function() {
                respond({
                  body:{ok: true}
                });
                respond(null);
              });
          })
        ()
      ()
    ()
  (fab)
).listen(config.poll.port);

function deliverComments(respond, status) {
  if (!this.url.query || !('since' in this.url.query)) {
    return {
      status: 400,
      body: {error: 'No ?since= parameter was given'}
    };
  }

  var since = parseInt(this.url.query.since, 10);
  // Negative since is used by new clients to get the last abs(since) comments
  if (since < 0) {
    var
      r = [],
      i = comments.length;

    while (i > 0) {
      i--;
      if (!status || comments[i].status == status) {
        r.push(comments[i]);
      }

      if (r.length == -since) {
        break;
      }
    }

    return {
      body: {
        ok: true,
        seq: (comments[comments.length-1] || {seq: 0}).seq,
        comments: r,
      }
    };
  }

  var
    r = [],
    i = comments.length;

  while (i > 0) {
    i--;
    if (comments[i].seq <= since) {
      break;
    }

    if (!status || comments[i].status == status) {
      r.push(comments[i]);
    }
  }

  if (!r.length) {
    commentListeners
      .push(function(comment) {
        if (status && comment.status != status) {
          return false;
        }

        respond({
          body: {
            ok: true,
            seq: comment.seq,
            comments: [comment],
          }
        });
        respond(null);
      });
    return;
  }

  return {
    body: {
      ok: true,
      seq: comments[comments.length-1].seq,
      comments: r,
    }
  };
};

function monitorComments() {
  puts('> monitoring comment stream ');

  db
    .changesStream()
    .addListener('change', function(change) {
      if (!change.id) {
        return;
      }

      db
        .getDoc(change.id)
        .addCallback(function(doc) {
          // Filter out the docs we care about
          // we could also use couch's filter docs this, but this is nice & simple
          if (doc.type != 'Comment') {
            return;
          }

          puts('< comment: '+JSON.stringify(doc));

          // Set the change seq for this comment
          doc.seq = change.seq;
          // Add it to the list of comments
          comments.push(doc);

          // Get rid of an old comment if the backlog is full
          if (comments.length > config.poll.backlog) {
            comments.shift();
          }

          commentListeners = commentListeners
            .filter(function(callback) {
              var r = callback(doc);
              // Remove listeners with no / true return values
              return (r === undefined)
                ? false
                : !r;
            });
        });
    })
    .addListener('end', function(hadError) {
      puts('< comment stream closed, re-opening in 3s (hadError: '+hadError+')');
      setTimeout(function() {
        monitorComments();
      }, 3000);
    });
}
monitorComments();