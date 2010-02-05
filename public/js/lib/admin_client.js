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
    
    
  /* ADMIN VARIABLE BITS */
  
    //these require _id to be appended by calling method
    spamUrl =  pollUrl + '/spammit/';
    inappropriateUrl =  pollUrl + '/inappropriatize/'; 

  /* ADMIN VARIABLE BITS END */
  
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
          /*
          This adds an LI element with simple text in. 
          Desire:
          * Add a link to approve/remove objects from the database live
          * In some manner make this unbreakable...(ha)
          */
          $messages.prepend(
            $('<tr/>')
              .append(
                $("<td id="+this._id+"/>").text(this.message)
              )
              .append(
                $("<td/>").prepend("<a href='#inappropriatize/"+this._id+"' id='"+this._id+"' class='inappropriateit'>inappropriate</a>")
              )
              .append(
                $("<td/>").prepend("<a href='#spammize/"+this._id+"' id='"+this._id+"' class='spammit'>spam</a>")
              )
            );
          });

              // .text(" mark as inappropriate"))
              // .text(this.message + "  ").append(
              //   $('<a href="#" class="inappropriateit"/>')
              //   .text(" mark as inappropriate")
              // ).append(" ").append(
              //     $('<a href="#" class="spammit"/>')
              //     .text(" mark as spam (block user)")
              //   )

        // Wait for PAUSE ms before re-connecting
        setTimeout(function() {
          poll();
        }, PAUSE);
      }
    })
  }

  poll();
});

