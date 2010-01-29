#!/usr/bin/env node
require('../lib/bootstrap');

var
  config = require('config/default'),

  // node core
  http = require('http'),
  // lib to ease request handling for this project
  Request = require('lib/request').Request,

  messages = [],
  messageListeners = [],

  db = require('dep/node-couch/module/node-couch')
    .CouchDB.db(
      config.couchDb.db,
      config.couchDb.port,
      config.couchDb.host
    ),

  changeClient = http.createClient(config.couchDb.port, config.couchDb.host),
  changeRequest = changeClient.request(
    'GET',
    // Couch 0.11.x (trunk) supports ?include_docs=true, but we'll do it without
    '/'+config.couchDb.db+'/_changes?feed=continuous&heartbeat=30000'
  );

// Avoid the http client closing the connection after 60sec
changeClient.setTimeout(0);

http
  .createServer(function(req, res) {
      var request = new Request(req, res);

      if (request.url.pathname !== '/messages') {
        return request.respond(404, {error: 404});
      }

      if (!('since' in request.url.query)) {
        return request.respond(400, {error: 'bad request, no ?since parameter'});
      }

      var since = parseInt(request.url.query.since, 10);
      // Negative since is used by new clients to get the last abs(since) messages
      if (since < 0) {
        var
          r = [],
          i = messages.length;

        while (i > 0) {
          i--;
          r.push(messages[i]);
          if (r.length == -since) {
            break;
          }
        }

        return request.respond(200, {
          ok: true,
          seq: (messages[messages.length-1] || {seq: 0}).seq,
          messages: r
        });
      }

      var
        r = [],
        i = messages.length;

      while (i > 0) {
        i--;
        if (messages[i].seq <= since) {
          break;
        }

        r.push(messages[i]);
      }

      if (!r.length) {
        return messageListeners
          .push(function(message) {
            request.respond(200, {
              ok: true,
              seq: message.seq,
              messages: [message]
            });
          });
      }

      return request.respond(200, {
        ok: true,
        seq: messages[messages.length-1].seq,
        messages: r
      });
  })
  .listen(config.poll.port);

// Watch CouchDB for changes
changeRequest.finish(function(res) {
  var buffer = '';
  res.addListener('body', function(chunk) {
    buffer += (chunk || '');

    var offset, change;
    while ((offset = buffer.indexOf("\n")) >= 0) {
      change = buffer.substr(0, offset);
      buffer = buffer.substr(offset +1);

      // Couch sends an empty line as the "heartbeat"
      if (change == '') {
        return puts('couch heartbeat');
      }

      puts('couch change: '+change);

      try {
        change = JSON.parse(change);
      } catch (e) {
        throw new Error('Could not parse change line: "'+change+'"');
      }

      if (!change.id) {
        return puts('weird couch change: '+JSON.stringify(change));
      }

      // Fetch the document for this change
      db.openDoc(change.id, {
        success: function(doc) {
          // Filter out the docs we care about
          // we could also use couch's filter docs this, but this is nice & simple
          if (doc.type != 'message' || !doc.show) {
            return;
          }

          // Set the change seq for this message
          doc.seq = change.seq;
          // Add it to the list of messages
          messages.push(doc);

          // Get rid of an old message if the backlog is full
          if (messages.length > config.poll.backlog) {
            messages.shift();
          }

          messageListeners = messageListeners
            .filter(function(callback) {
              var r = callback(doc);
              // Remove listeners with no / false return values
              return (r === undefined)
                ? false
                : r;
            });
        },
        error: function(e) {
          throw e;
        }
      });
    }
  });

  res.addListener('complete', function() {
    throw new Error('CouchDB closed /_changes stream on us!');
  });
});