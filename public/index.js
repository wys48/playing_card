
var gridsize = 50;
var topmargin = 50;
var leftmargin = 50;

var gridnum = null; // 盤面の幅
var socket = null;  // サーバとの接続
var myself = null;  // 自分自身の色名称
// var grids = null;    // 盤面の二次元配列
var turn = null;

var LOCALSTORAGE_NICKNAME = "playing_card.nickname";

function ismyturn() {
  return (myself !== null) && (myself === turn);
}

/// @function Sync.load
/// Loads an resource
/// @param {String} id the GUID of the resource
/// @param {Function} success callback to be executed with the data on suceess
/// @param {Function} error callback to be executed with error description in case of failure
/// Loads an resource
function makedata(data) {
  data.color = myself;
  data.timestamp = Date.now();
  return data;
}

//--------------------------------------------------------------------------------
// document.onload
//
$(function () {
  if(window.localStorage) {
    // localStorageに保存されたニックネームを復元
    var name = window.localStorage.getItem(LOCALSTORAGE_NICKNAME);
    if(name != null) {
      $("#nickname").val(name);
    }
  }

  socket = io.connect();
  socket.on('connect', function () {
    socket.emit('enter_index');
  });

  socket.on('user_id', function (user_id) {
    $('#user_id').val(user_id);
    $('#enter').attr('disabled', false);
  });

  /**
   * @fn room_update
   * @brief ルーム一覧の更新
   */
  function on_room_update() {}
  socket.on('room_update', function (roomlist) {
    var obj = $('#room_id');
    obj.children().remove();
    obj.append($('<option>').val('').text('(新規ルーム)'));
    for (var i = 0; i < roomlist.length; ++i) {
      obj.append($('<option>').val(roomlist[i].room_id).text(roomlist[i].room_name));
    }
  });

  socket.on('post', function (post) {
    if(post.clear === true) {
      $('#posts').children().remove();
    }
    var li = $('<li>').text(post.name + ': ' + post.message + ' (' + Date.now() + ')');
    $('#posts').prepend(li);
  });

  $("#enter").click(function() {
    if(window.localStorage) {
      // localStorageにニックネームを保存
      window.localStorage.setItem(LOCALSTORAGE_NICKNAME, $("#nickname").val());
    }
    $("#enter").attr("disabled", true);
    return true;
  });

  $("#room_id").change(function() {
    if($(this).val() === "") {
      $("#play").val("作成");
    } else {
      $("#play").val("参加");
    }
  });

});

// vim: et sts=2 sw=2:

