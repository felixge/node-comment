var
  Promise = require('events').Promise,
  url = require('url');

var Request = exports.Request = function(req, res) {
  this.url = url.parse(req.url, true);
  this.req = req;
  this.res = res;
  this.method = req.method.toLowerCase();
};

Request.prototype.respond = function(code, data) {
  if (code instanceof Promise) {
    var self = this;
    return code
      .addCallback(function(val) {
        self.respond(val);
      });
  }

  if (typeof code != 'number') {
    data = code;
    code = 200;
  }

  var jsonp;
  if (this.url.query && this.url.query.callback) {
    jsonp = this.url.query.callback;
  }

  data = JSON.stringify(data);
  if (jsonp) {
    data = jsonp+'('+data+');';
  }

  this.res.sendHeader(code, {
    // Would love to use a better content-type, but IE will try to download the file otherwise
    'Content-Type': 'text/plain',
    'Content-Length': data.length,
  });

  this.res.sendBody(data);
  this.res.finish();
};