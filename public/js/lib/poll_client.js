$(function() {
  var
    TIMEOUT = 3 * 1000,
    PAUSE = 1 * 1000,

    since = -10,

    $status = $('#status'),
    $comments = $('#comments'),
    pollUrl = [
      'http://',
      window.location.hostname,
      ':',
      8012, // @todo, read from config/default.js
      '/comments'
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

        $status.text('Fetched '+r.comments.length+' comments, re-connect in '+PAUSE+' ms');

        var template = "<li>{{comment}} <strong class='ago'>({{ago}})</strong> </li>";

        // Show the new comments
        for (var i = r.comments.length - 1; i >= 0; i--) {
          var item = r.comments[i];
          var view = {
            ago: function(){
              return $.timeago(new Date(item.time));
            },
            comment: item.text
          };
          var html = Mustache.to_html(template, view);
          
          $comments.prepend(html);
        }

        // Wait for PAUSE ms before re-connecting
        setTimeout(function() {
          poll();
        }, PAUSE);
      }
    })
  }

  poll();
  function post(url) {
    $admin-text.text('Sending a command to '+url+'...');
    $.jsonp({
      url:url,
      callbackParameter: 'callback',
      timeout: TIMEOUT,
      error: function(xOptions, status) {
        if (status != 'timeout') {
          $admin-text.text('JSONP error: '+status);
        }
      }
    })
  }
});