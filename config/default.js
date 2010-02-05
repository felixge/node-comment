// Push server setup
exports.push = {
  port: 8011,
};

// Poll server setup
exports.poll = {
  port: 8012,
  // Amount of messages to keep in memory
  backlog: 100,
};

exports.admin = {
  port: 8013,
};

// CouchDB connection
exports.couchDb = {
  db: 'comments',
  host: 'localhost',
  port: 5984,
};