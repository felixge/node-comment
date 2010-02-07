$(function() {
  var
    $status = $('#pushstatus'),
    $message = $('#message'),
    pushUrl = [
      'http://',
      window.location.hostname,
      ':',
      window.location.port, // @todo, read from config/default.js
      '/message'
    ].join('');

  $('form').submit(function() {
    var val = $message.val();

    $status.text('Sending message ...');
    $message.val('');

    var start = +new Date;
    $.ajax({
      url: pushUrl,
      data: {message: val},
      dataType: 'jsonp',
      success: function() {
        var duration = (+new Date - start);
        $status.text('Message pushed to couch in '+duration+'ms');
      }
    })

    return false;
  });
});