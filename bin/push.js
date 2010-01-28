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

        if (request.url.pathname != '/message') {
          return request.respond(404, {error: 404});
        }

        if (!request.url.query['message']) {
          return request.respond(400, {error: 'bad request, no message parameter'});
        }

        db.saveDoc({
          _id: uuid.generate(),
          message: request.url.query['message'],
          show: true,
        }, {
          success: function() {
            request.respond(200, {ok: 'message stored'});
          },
          error: function(e) {
            throw e;
          },
        });
      });
  })
  .listen(config.push.port);