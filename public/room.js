/**
 * @file room.js
 * @brief 待合室ページのスクリプト
 */

/**
 * @fn document.onload
 */
$(function () {
  var socket = io.connect();

  /**
   * @fn socket.on.connect
   * @brief サーバとの接続完了
   */
  socket.on('connect', function () {
    socket.emit('enter_room', $("#user_id").val()); //!< roomページへ入ったことを通知
  });

  /**
   * @fn socket.on.update_user
   * @brief ユーザリストを更新
   * @param users   [in] ユーザ情報 {nickname:, state:} の配列
   */
  socket.on('update_user', function (users) {
    var obj = $('#users')
    obj.children().remove();
    for (var i = 0; i < users.length; ++i) {
      var u = users[i];
      obj.append($("<li>").text(u.nickname + " : " + u.state));
    }
  });

  /**
   * @fn #play.click
   * @brief ゲーム開始ボタンのクリックイベント処理
   */
  $("#play").click(function() {
    $("#play").attr("disabled", true);
    $("#form").submit();
  });

});

// vim: et sts=2 sw=2:
