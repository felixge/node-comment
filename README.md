# Node Comment PoC

## Running

1. Make sure you have a CouchDB running on localhost:5984, otherwise edit `config/default.js`
2. Create a new CouchDB database called 'node-comment'
3. Run the push/poll server in a terminal each

        # Terminal A
        $ node bin/poll_server.js

        # Terminal B
        $ node bin/push_server.js

4. Navigate to [http://localhost:8011/](http://localhost:8011/)

You should now be able to send messages through the `push.html` page and see them appear on `pull.html`.

## Design

`bin/push_server.js` provides a HTTP server that receives message via JSONP and stores them as CouchDB documents.

`bin/poll_server.js` listens to CouchDB's [/_changes][3] stream to find out about new messages coming in. It then delivers the new messages to any clients that are listening.

## Configuration

The poc can be configured by modifying the `config/default.js` file. However, the poll.html page has the poll port hardcoded for now.

## Dependencies

* [node-couch][1]: CouchDB connector. Had to fix it to work with latest node version. I'd prefer to write a better one, but it does the job for now.
* [node-paperboy][2]: A node module I wrote to serve static HTML/JS/etc. files
* [jquery][4]: Hopefully your JS library of choice : )
* [jquery-jsonp][5]: jQuery has only minimal JSONP support. This plugin has all the goods!

[1]: http://github.com/sixtus/node-couch
[2]: http://github.com/felixge/node-paperboy
[3]: http://jquery.com/
[4]: http://books.couchdb.org/relax/reference/change-notifications
[5]: http://code.google.com/p/jquery-jsonp/