$(function() {
  var
    $status = $('#pushstatus'),
    $comment = $('#comment'),
    pushUrl = [
      'http://',
      window.location.hostname,
      ':',
      window.location.port, // @todo, read from config/default.js
      '/comments/add'
    ].join('');

  $('form').submit(function() {
    var val = $comment.val();

    $status.text('Sending comment ...');
    $comment.val('');

    var start = +new Date;
    $.ajax({
      url: pushUrl,
      data: {text: val},
      dataType: 'jsonp',
      success: function() {
        var duration = (+new Date - start);
        $status.text('Comment pushed to couch in '+duration+'ms');
      }
    })

    return false;
  });
});