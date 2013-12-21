
//--------------------------------------------------------------------------------
// document.onload
//
$(function () {
  console.log('---- room.js -----------------------------------------------');
  socket = io.connect();
  socket.on('connect', function () {
    console.log('socket: connected');
    socket.emit('enter_room', $("#user_id").val());
  });

  socket.on('user_update', function (users) {
    console.log('---- user_update -------------------------------------------');
    console.log(users);
    var obj = $('#users')
    obj.children().remove();
    for (var i = 0; i < users.length; ++i) {
      var u = users[i];
      obj.append($("<li>").text(u.nickname + " : " + u.state));
    }
  });

});

// vim: et sts=2 sw=2:

