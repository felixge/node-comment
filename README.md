# Node Comment PoC

## Design

`bin/push.js` provides a HTTP server that receives message via JSONP and stores them as CouchDB documents.

`bin/poll.js` listens to CouchDB's [/_changes][3] stream to find out about new messages coming in. It then delivers the new messages to any clients that are listening.

## Configuration

The poc can be configured by modifying the `config/default.js` file. However, the poll.html page has the poll port hardcoded for now.

## Dependencies

* [node-couch][1]: CouchDB connector. Had to fix it to work with latest node version. I'd prefer to write a better one, but it does the job for now.
* [node-paperboy][2]: A node module I wrote to serve static HTML/JS/etc. files

[1]: http://github.com/sixtus/node-couch
[2]: http://github.com/felixge/node-paperboy
[3]: http://books.couchdb.org/relax/reference/change-notifications