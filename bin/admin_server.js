#!/usr/bin/env node
require('../lib/bootstrap');

var
  config = require('config/default'),

  // node core
  http = require('http'),
  // my lib to serve static files
  paperboy = require('dep/node-paperboy/lib/paperboy'),

  // lib to ease request handling for this project
  Request = require('lib/request').Request,

  // A quick little module to generate uuids
  uuid = require('lib/uuid'),

  db = require('dep/node-couch/module/node-couch').CouchDB.db(
    config.couchDb.db,
    config.couchDb.port,
    config.couchDb.host
  );

http
  .createServer(function(req, res) {
    paperboy
      .deliver('public', req, res)
      .otherwise(function() {
        var
          request = new Request(req, res);
        
        puts("hiya");
        // puts('receipt!');
        // puts(request.url.query['action']);


//         _id: uuid.generate(),
//         // would probably be better as an ISO string for sorting
//         time: +new Date,
//         type: 'message',
//         message: request.url.query['message'],
// relaxdb_class: "Comment",
// status: 'awaiting_response', //awaiting_response || spam || inappropriate || destroyed states
//         show: true,

//  status: 'awaiting_response', //awaiting_response || spam || inappropriate || destroyed states

        if (request.url.query['action']==="approve") {
          params = {
            _id: request.url.query['_id'],
            status: 'approved',
            show: true,
          };
          do_update(params, request);
        }
        else if(request.url.query['action']==="spam") {
          params = {
            _id: request.url.query['_id'],
            status: 'spam',
            show: false,
          };
          do_update(params, request);
        } 
        else if (request.url.query['action']==="inappropriate") {
            params = {
              _id: request.url.query['_id'],
              status: 'inappropriate',
              show: false,
            };
            do_update(params, request);
        }
        else if (request.url.query['action']==="delete") {
            params = {
              _id: request.url.query['_id'],
              status: 'deleted',
              show: false,
            };
            do_update(params, request);
        } else {
              request.respond(400, {ok: 'badness'});
        };
        puts(params);
      });
  })
  .listen(config.admin.port);
  
  function do_update(params, request) {
    //db call
     // db.saveDoc({
     //     _id: uuid.generate(),
     //     // would probably be better as an ISO string for sorting
     //     time: +new Date,
     //     type: 'message',
     //     message: request.url.query['message'],
     //         relaxdb_class: "Comment",
     //         status: 'awaiting_response', //awaiting_response || spam || inappropriate || destroyed states
     //     show: true,
     //   }, {
     //     success: function() {
     //       request.respond(200, {ok: 'message stored'});
     //     },
     //     error: function(e) {
     //       throw e;
     //     },
     //   });
    request.respond(200, {ok: " "+params['status']});
  }