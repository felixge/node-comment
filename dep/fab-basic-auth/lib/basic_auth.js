var base64 = require('../dep/base64');

// Guards a realm from unauthorized access
exports.fabware = function(user, pass, realm) {
  var expected = 'Basic '+base64.encode(user+':'+pass);
  realm = realm || 'Secure Area';
  return function(handler) {
    return function(respond) {
      if (this.headers['authorization'] !== expected) {
        return {
          status: 401,
          headers: {'WWW-Authenticate': 'Basic realm="'+realm+'"'},
          body: '401',
        };
      }

      // Stream the data if auth is successful
      handler.call(this, respond);
    };
  };
};