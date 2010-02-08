$(function() {
  var
    TIMEOUT = 3 * 1000,
    PAUSE = 1 * 1000,

    since = -10,

    $status = $('#status'),
    $comments = $('#comments'),
    updateUrl = [
      'http://',
      window.location.hostname,
      ':',
      8012,
      '/admin/comments/update'
    ].join('');
     
    pollUrl = [
      'http://',
      window.location.hostname,
      ':',
      8012,
      '/admin/comments'
    ].join('');

  function do_update(pId,pAction) {

    var id = pId, action = pAction;
    var start = +new Date;
    $.ajax({
      url: updateUrl,
      data: {id: id, action: action},
      dataType: 'jsonp',
      success: function(response) {
        // var duration = (+new Date - start);
        $("#admin-notes").text('I WANT TO CHANGE THE TEXT IN THE ITEMS SPAM/THINGY');
      },
      error:function (xhr, ajaxOptions, thrownError){
        alert(thrownError);
      }
    });
    return false;
  }
  
  function poll() {
    var
      url = pollUrl+'?since='+since+'&admin=1';

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

        if ($('#comments').children().length == 0) {
          // Show the new comments
          $.each(r.comments, function() {
            /*
            This adds an LI element with simple text in. 
            Desire:
            * Add a link to approve/remove objects from the database live
            * In some manner make this unbreakable...(ha)
            */
            $comments.append(
              $('<tr/>')
                .append(
                  $("<td id="+this._id+"/>").text(this.text)
                )
                .append(
                  $("<td/>").prepend("<a href='#publish/"+this._id+"' id='"+this._id+"' class='publish'>publish...</a>")
                )
                .append(
                  $("<td/>").prepend("<a href='#spammize/"+this._id+"' id='"+this._id+"' class='spammit'>spam</a>")
                )
              );
            });          
        } else {
          // Show the new comments
          $.each(r.comments, function() {
            /*
            This adds an LI element with simple text in. 
            Desire:
            * Add a link to approve/remove objects from the database live
            * In some manner make this unbreakable...(ha)
            */
            $comments.prepend(
              $('<tr/>')
                .append(
                  $("<td id="+this._id+"/>").text(this.text)
                )
                .append(
                  $("<td/>").prepend("<a href='#inappropriatize/"+this._id+"' id='"+this._id+"' class='inappropriateit'>inappropriate</a>")
                )
                .append(
                  $("<td/>").prepend("<a href='#spammize/"+this._id+"' id='"+this._id+"' class='spammit'>spam</a>")
                )
              );
            });          
        }
        
              // .text(" mark as inappropriate"))
              // .text(this.comment + "  ").append(
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
  
  
  // var $status = $("#status");

     $(".spammit").livequery('click', function(){
       comment = $(this).parent().prev().text();
       $("#admin-notes").text("Sending a 'spam' flag for the comment: " + comment);
       send_to_trash(this, "spam");
       return false
     });

     $(".publish").livequery('click', function(){
       comment = $(this).parent().prev().text();
       $("#admin-notes").text("Publishing the comment: " + comment);
       send_to_trash(this, "publish");
       return false
     });

     function get_status(item, action) {
       //This should probably return a spinning progress icon until the transaction is completed, we'll use the TD hook that contains this to do that with ajax:success
       if(action) {
         do_update(id, action);
       } else {
         return "fail"
       }
     }

     function get_options(item) {
       // return 123;
       return ($("<span class='text-divider'/>").text(" | "))
         .prepend($("<a href='#restore' />").text("Restore"))
         .append($("<a href='#ban' />").text("Ban user")
       )
     }
     
     function send_to_trash(item, action) {
       // .hide("slow");
       id = $(item).attr("id");
       tr =  $("<tr id='"+id+"'/>")
         .append(
           $("<td/>").text($(item).parent().prev().text())
         )
         .append(
           $("<td/>").text(id)
         )
         .append(
           $("<td class='status'/>").text(get_status(id, action))
         )
         .append(
           $("<td class='options'/>").append(get_options(item))
         )
       $("#trashed_comments").append(
         tr
       );
       $(item).parent().parent().hide("dissolve");


       // $("#trashed_comments").append($(item).parent().parent().hide("slow"));//$(item)).reveal("slow");
     }

});
