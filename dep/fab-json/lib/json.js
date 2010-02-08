// Serializes data.body objects into JSON
exports.fabware = function(jsonp) {
  return function(handler) {
    return function(respond) {
      var self = this;
      return handler.call(this, function(data) {
        if (data && (typeof (data.body) !== 'string')) {
          data.body = JSON.stringify(data.body);
          if (jsonp && self.url.query && (jsonp in self.url.query)) {
            data.body = self.url.query[jsonp]+'('+data.body+');';
          }
          data.body += "\n";
        }
        respond(data);
      });
    };
  };
};