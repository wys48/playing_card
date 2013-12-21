/**
 * @file index.js
 * @brief 本システムの最初の入り口になるページのスクリプト
 */

var LOCALSTORAGE_NICKNAME = "playing_card.nickname";

/**
 * @fn document.onload
 */
$(function () {
  var socket = io.connect();

  if(window.localStorage) {
    // localStorageに保存されたニックネームを復元
    var name = window.localStorage.getItem(LOCALSTORAGE_NICKNAME);
    if(name != null) {
      $("#nickname").val(name);
    }
  }

  /**
   * @fn socket.on.connect
   * @brief サーバとの接続完了
   */
  socket.on('connect', function () {
    socket.emit('enter_index'); //!< indexページへ入ったことを通知
  });

  /**
   * @fn socket.on.create_user_id
   * @brief サーバから自分自身のユーザIDを受信
   * @param user_id   [in] ユーザID
   * @note ユーザIDはサーバが生成する
   */
  socket.on('create_user_id', function (user_id) {
    $('#user_id').val(user_id);
    $('#enter').attr('disabled', false);
  });

  /**
   * @fn socket.on.update_room
   * @brief ルーム一覧の更新
   * @param roomlist  [in] ルーム情報 {room_id:, room_name:} の配列
   */
  socket.on('update_room', function (roomlist) {
    var obj = $('#room_id');
    obj.children().remove();
    obj.append($('<option>').val('').text('(新規ルーム)'));
    for (var i = 0; i < roomlist.length; ++i) {
      obj.append($('<option>').val(roomlist[i].room_id).text(roomlist[i].room_name));
    }
    obj.change();
    $('#enter').show();
  });

  /**
   * @fn socket.on.add_message
   * @brief メッセージエリアのテキスト受信
   * @param post    [in] メッセージデータ {name:, message:, clear:}
   */
  socket.on('add_message', function (post) {
    if(post.clear === true) {
      $('#messages').children().remove();
    }
    var li = $('<li>').text(post.name + ': ' + post.message + ' (' + (new Date()).toLocaleString() + ')');
    $('#messages').prepend(li);
  });

  /**
   * @fn #enter.click
   * @brief 作成参加ボタンのクリックイベント処理
   */
  $("#enter").click(function() {
    if(window.localStorage) {
      // localStorageにニックネームを保存
      window.localStorage.setItem(LOCALSTORAGE_NICKNAME, $("#nickname").val());
    }
    $("#enter").attr("disabled", true);
    $("#form").submit();
  });

  /**
   * @fn #room_id.change
   * @brief ルーム選択の変更イベント処理
   */
  $("#room_id").change(function() {
    if($(this).val() === "") {
      $("#enter").val("作成");
    } else {
      $("#enter").val("参加");
    }
  });

});

// vim: et sts=2 sw=2:
