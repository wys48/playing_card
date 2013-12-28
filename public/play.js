/**
 * @file play.js
 * @brief ゲームプレイページのスクリプト(本システムのメイン)
 */

var g_cards = {};
var g_refresh = false;
var g_image = new Image();
g_image.src = "images/cards_trump.png";
var g_dragging = null;
var g_regions = {};
var g_users = [];

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
    socket.emit('enter_play', $("#user_id").val()); //!< playページへ入ったことを通知
  });

  /**
   * @fn socket.on.update_card
   * @brief カード更新
   * @param cards   [in] カード情報 {card_id:, ...} の配列
   */
  socket.on('update_card', function (cards) {
    for (var i in cards) {
      var card = cards[i];
      g_cards[card.card_id] = card;
    }
    g_refresh = true;
  });

  /**
   * @fn socket.on.update_user
   * @brief ユーザの更新
   * @param users   [in] ユーザ情報 {nickname:, state:, ...} の配列
   */
  socket.on('update_user', function (users) {
    var obj = $('#users')
    obj.children().remove();
    g_users = users;
    for (var i = 0; i < users.length; ++i) {
      var u = users[i];
      obj.append($("<li>").text(u.nickname + " : " + u.state));
    }
    g_refresh = true;
  });

  /**
   * @fn #main.mousedown
   * @brief マウスダウンイベント処理
   * @param event   [in] イベント情報
   */
  $("#main").mousedown(function(event){
    if (hittest_user(event)) return;
    var found = hittest_card(event);
    if (found.card_id == null) return;
    // ドラッグ操作開始
    g_dragging = found;
    // サーバへの移動開始通知
    var user_id = $("#user_id").val();
    socket.emit('pick_card', {user_id: user_id, card_id: g_dragging.card_id});
  });

  /**
   * @fn #main.mousemove
   * @brief マウス移動イベント処理
   * @param event   [in] イベント情報
   */
  $("#main").mousemove(function(event){
    if (g_dragging == null) return;
    // ドラッグ中
    var rect = event.target.getBoundingClientRect();
    var mx = event.clientX - rect.left;
    var my = event.clientY - rect.top;
    var card = g_cards[g_dragging.card_id];
    var region = g_regions.field;
    card.dx = Math.min(Math.max(g_dragging.xoffset + mx, region.x), region.x + region.w - card.dw);
    card.dy = Math.min(Math.max(g_dragging.yoffset + my, region.y), region.y + region.h - card.dh);
    g_refresh = true;
  });

  /**
   * @fn #main.mouseup
   * @brief マウスアップイベント処理
   * @param event   [in] イベント情報
   */
  $("#main").mouseup(function(event){
    if (g_dragging == null) return;
    // ドラッグ終了
    var card = g_cards[g_dragging.card_id];
    var user_id = $("#user_id").val();
    socket.emit('move_card', {user_id: user_id, card_id: g_dragging.card_id, x: card.dx, y: card.dy});
    g_dragging = null;
  });

  /**
   * @fn #main.dblclk
   * @brief ダブルクリックイベント処理
   * @param event   [in] イベント情報
   */
  $("#main").dblclick(function(event){
    var user_id = $("#user_id").val();
    var found = hittest_card(event);
    if (found.card_id == null) return;
    socket.emit('click_card', {user_id: user_id, card_id: found.card_id});
  });

  /**
   * @brief 定期処理(描画)
   */
  setInterval(function() {
    if (g_refresh == false) return;
    var canvas = $("#main")[0];
    var context = canvas.getContext('2d');
    draw_field(context);
    draw_hands(context);
    draw_users(context);
    g_refresh = false;
  }, 100);

  /**
   * @fn init_regions
   * @brief 領域の初期化
   */
  function init_regions() {
    var canvas = $("#main")[0];
    g_regions["users"] = {x: null, y: 0, w: 100, h: canvas.height};
    g_regions["hands"] =
      {x: 0, y: null, w: canvas.width - g_regions.users.w, h: 100};
    g_regions["field"] =
      {x: 0, y: 0, w: canvas.width - g_regions.users.w, h: canvas.height - g_regions.hands.h};
    g_regions.users.x = g_regions.field.x + g_regions.field.w;
    g_regions.hands.y = g_regions.field.y + g_regions.field.h;
  }

  init_regions();

  /**
   * @fn draw_field
   * @brief 場を描画
   * @param context   [in] Canvas context
   */
  function draw_field(context) {
    var region = g_regions.field;
    context.save();
    context.setTransform(1, 0, 0, 1, region.x, region.y);
    context.fillStyle = "green";
    context.fillRect(0, 0, region.w, region.h);
    context.lineWidth = 1;
    var sorted_cards = [];
    for (var card_id in g_cards) {
      sorted_cards.push(g_cards[card_id]);
    }
    sorted_cards.sort(function (a, b) {
      return a.z - b.z;
    });
    for (var card_index = 0; card_index < sorted_cards.length; ++card_index) {
      var card = sorted_cards[card_index];
      context.drawImage(g_image, card.sx, card.sy, card.sw, card.sh,
                        card.dx, card.dy, card.dw, card.dh);
      context.beginPath();
      if (g_dragging != null && g_dragging.card_id == card.card_id) {
        context.strokeStyle = "blue";
      } else if (card.picker != null) {
        context.strokeStyle = "red";
      } else {
        context.strokeStyle = "black";
      }
      context.rect(card.dx, card.dy, card.dw, card.dh);
      context.stroke();
    }
    context.restore();
  }

  /**
   * @fn draw_hands
   * @brief 手札領域を描画
   * @param context   [in] Canvas context
   */
  function draw_hands(context) {
    var region = g_regions.hands;
    context.save();
    context.setTransform(1, 0, 0, 1, region.x, region.y);
    context.fillStyle = "gray";
    context.fillRect(0, 0, region.w, region.h);
    context.restore();
  }

  /**
   * @fn draw_users
   * @brief 参加者リスト領域を描画
   * @param context   [in] Canvas context
   */
  function draw_users(context) {
    var region = g_regions.users;
    context.save();
    context.setTransform(1, 0, 0, 1, region.x, region.y);
    context.fillStyle = "pink";
    context.fillRect(0, 0, region.w, region.h);
    context.textAlign = "left";
    context.textBaseline = "bottom";
    context.strokeStyle = "black";
    context.lineWidth = 1;
    context.font = "16pt 'Times New Roman'";
    for (var i in g_users) {
      var user = g_users[i];
      if (user.sem_owner) {
        context.fillStyle = "red";
      } else {
        context.fillStyle = "pink";
      }
      context.fillRect(0, 0, region.w, 32);
      context.fillStyle = "black";
      context.fillText(user.nickname, 0, 28);
      context.transform(1, 0, 0, 1, 0, 32);
    }
    context.stroke();
    context.restore();
  }

  /**
   * @fn hittest_card
   * @brief クリック対象の判定(カード)
   * @param event   [in] イベント情報
   */
  function hittest_card(event){
    var rect = event.target.getBoundingClientRect();
    var mx = event.clientX - rect.left;
    var my = event.clientY - rect.top;
    var found = {card_id: null, xoffset: 0, yoffset: 0, z: 0};
    for (var card_id in g_cards) {
      var card = g_cards[card_id];
      if (card.dx <= mx && card.dy <= my && mx < (card.dx + card.dw) && my < (card.dy + card.dh)) {
        if(found.card_id == null || found.z < card.z) {
          found.card_id = card_id;
          found.xoffset = card.dx - mx;
          found.yoffset = card.dy - my;
          found.z = card.z;
        }
      }
    }
    if (found.card_id != null) {
      var picker = g_cards[found.card_id].picker;
      var user_id = $("#user_id").val();
      if (picker != null && picker != user_id) {
        found.card_id = null;
      }
    }
    return found;
  }

  /**
   * @fn hittest_user
   * @brief クリック対象の判定(ユーザ)
   * @param event   [in] イベント情報
   */
  function hittest_user(event) {
    var rect = event.target.getBoundingClientRect();
    var region = g_regions.users;
    var mx = event.clientX - rect.left - region.x;
    var my = event.clientY - rect.top - region.y;

    if (mx < 0 || mx >= region.w || my < 0 || my >= region.h) return false;
    var i = Math.floor(my / 32);
    var user = g_users[i];
    if (user != null) {
      var user_id = $("#user_id").val();
      socket.emit('give_semaphore', {user_id: user_id, receiver_user_id: user.user_id});
    }
    return true;
  }

});

// vim: et sts=2 sw=2:
