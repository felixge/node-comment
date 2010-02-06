$(function() {
  var
    TIMEOUT = 3 * 1000,
    PAUSE = 1 * 1000,

    since = -10,

    $status = $('#status'),
    $messages = $('#messages'),
    pollUrl = [
      'http://',
      window.location.hostname,
      ':',
      8012, // @todo, read from config/default.js
      '/messages'
    ].join('');

  function poll() {
    var
      url = pollUrl+'?since='+since;

    $status.text('Polling '+url+' ...');

    $.jsonp({
      url: url,
      callbackParameter: 'callback',
      timeout: TIMEOUT,
      error: function(xOptions, status) {
        if (status != 'timeout') {
          $status.text('JSONP error: '+status);
        } else {
          $status.text('Timeout, re-connect in '+PAUSE+' ms');
        }

        // Wait for PAUSE ms before re-connecting
        setTimeout(function() {
          poll();
        }, PAUSE);
      },
      success: function(r) {
        // Remember were we left off
        since = r.seq;

        $status.text('Fetched '+r.messages.length+' messages, re-connect in '+PAUSE+' ms');

        // Show the new messages
        $.each(r.messages, function() {
          $messages.prepend(
            $('<li/>')
              .text(this.message)
          );
        });

        // Wait for PAUSE ms before re-connecting
        setTimeout(function() {
          poll();
        }, PAUSE);
      }
    })
  }

  poll();
});