/**
 * @file play.js
 * @brief ゲームプレイページのスクリプト(本システムのメイン)
 */

var g_self_id = null;
var g_cards = {};
var g_refresh = false;
var g_image = new Image();
g_image.src = "images/cards_trump.png";
var g_dragging = null;
var g_regions = {};
var g_users = [];

/**
 * @fn lookup_region
 * @brief キャンバス座標から領域を検索する
 * @param x       [in] X座標(キャンバス座標系)
 * @param y       [in] Y座標(キャンバス座標系)
 * @retval null   該当領域無し
 * @return {region: 領域オブジェクト, rx: 相対X座標, ry: 相対Y座標}
 */
function lookup_region(x, y) {
  for (var key in g_regions) {
    var region = g_regions[key];
    var rx = x - region.x;
    var ry = y - region.y;
    if(0 <= rx && rx < region.w && 0 <= ry && ry < region.h) {
      return {region: region, rx: rx, ry: ry};
    }
  }
  return null;
}

function get_card_region(card) {
  if (card.owner_id === null) {
    return g_regions.field;
  } else if (card.owner_id == g_self_id) {
    return g_regions.hands;
  }
  return null;
}

function event_to_canvas_coord(event) {
  var rect = event.target.getBoundingClientRect();
  return {x: event.clientX - rect.left, y: event.clientY - rect.top};
}

/**
 * @fn document.onload
 */
$(function () {
  var socket = io.connect();
  g_self_id = $("#user_id").val();

  /**
   * @fn socket.on.connect
   * @brief サーバとの接続完了
   */
  socket.on('connect', function () {
    socket.emit('enter_play', g_self_id); //!< playページへ入ったことを通知
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
    var card = g_cards[found.card_id];
    g_dragging = found;
    g_dragging.dx = card.rx + found.region.x;
    g_dragging.dy = card.ry + found.region.y;
    g_dragging.old_rx = card.rx;
    g_dragging.old_ry = card.ry;
    // サーバへの移動開始通知
    socket.emit('pick_card', {user_id: g_self_id, card_id: g_dragging.card_id});
  });

  /**
   * @fn event2canvasXY
   * @brief マウスイベント座標をキャンバス座標に変換
   * @param event   [in] イベント情報
   * @return {x: X座標, y: Y座標}
   */
  function event2canvasXY(event) {
    var rect = event.target.getBoundingClientRect();
    return {x: event.clientX - rect.left, y: event.clientY - rect.top};
  }

  /**
   * @fn #main.mousemove
   * @brief マウス移動イベント処理
   * @param event   [in] イベント情報
   */
  $("#main").mousemove(function(event){
    if (g_dragging === null) return;
    // ドラッグ中
    var mouse = event2canvasXY(event);
    var card = g_cards[g_dragging.card_id];
    // キャンバスの外には出られないようにする
    var canvas = $("#main")[0];
    g_dragging.dx = Math.min(Math.max(g_dragging.xoffset + mouse.x, 0), canvas.width - card.dw);
    g_dragging.dy = Math.min(Math.max(g_dragging.yoffset + mouse.y, 0), canvas.height - card.dh);
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
    var mouse = event2canvasXY(event);
    var card = g_cards[g_dragging.card_id];
    // 移動先の領域判定
    var destination = lookup_region(mouse.x, mouse.y);
    var region = (destination !== null) ? destination.region : null;
    if (region === null || !region.placable) {
      // 移動キャンセル (行き先が無い)
      card.rx = g_dragging.old_rx;
      card.ry = g_dragging.old_ry;
    } else {
      if (region.name == "field") {
        card.owner_id = null;
      } else if (region.name == "hands") {
        card.owner_id = g_self_id;
      } else {
        alert("panic (not placable region)");
      }
      var rx = destination.rx + g_dragging.xoffset;
      var ry = destination.ry + g_dragging.yoffset;
      card.rx = Math.min(Math.max(0, rx), region.w - card.dw);
      card.ry = Math.min(Math.max(0, ry), region.h - card.dh);
    }
    socket.emit('move_card',
      {user_id: g_self_id, card_id: card.card_id,
       rx: card.rx, ry: card.ry,
       owner_id: card.owner_id});
    g_dragging = null;
  });

  /**
   * @fn #main.dblclk
   * @brief ダブルクリックイベント処理
   * @param event   [in] イベント情報
   */
  $("#main").dblclick(function(event){
    var found = hittest_card(event);
    if (found.card_id == null) return;
    socket.emit('click_card', {user_id: g_self_id, card_id: found.card_id});
  });

  /**
   * @brief 定期処理(描画)
   */
  setInterval(function() {
    if (g_refresh == false) return;
    var canvas = $("#main")[0];
    var context = canvas.getContext('2d');
    var sorted_cards = [];
    for (var card_id in g_cards) {
      sorted_cards.push(g_cards[card_id]);
    }
    sorted_cards.sort(function (a, b) {
      return a.z - b.z;
    });
    draw_field(context, sorted_cards);
    draw_hands(context, sorted_cards);
    draw_users(context, sorted_cards);
    if (g_dragging !== null) {
      draw_card(context, g_cards[g_dragging.card_id]);
    }
    g_refresh = false;
  }, 100);

  /**
   * @fn init_regions
   * @brief 領域の初期化
   */
  function init_regions() {
    var canvas = $("#main")[0];
    g_regions["users"] =
      {name: "users", x: null, y: 0, w: 100, h: canvas.height,
       placable: false};
    g_regions["hands"] =
      {name: "hands", x: 0, y: null, w: canvas.width - g_regions.users.w, h: 150,
       placable: true};
    g_regions["field"] =
      {name: "field", x: 0, y: 0, w: canvas.width - g_regions.users.w, h: canvas.height - g_regions.hands.h,
       placable: true};
    g_regions.users.x = g_regions.field.x + g_regions.field.w;
    g_regions.hands.y = g_regions.field.y + g_regions.field.h;
  }

  init_regions();

  /**
   * @fn draw_card
   * @brief 1枚のカードの描画
   * @param context   [in] Canvas context
   * @param card      [in] card
   */
  function draw_card(context, card) {
    var x, y;
    if(g_dragging !== null && card.card_id === g_dragging.card_id) {
      x = g_dragging.dx;
      y = g_dragging.dy;
    } else {
      x = card.rx;
      y = card.ry;
    }

    context.lineWidth = 1;
    context.drawImage(g_image, card.sx, card.sy, card.sw, card.sh,
                      x, y, card.dw, card.dh);
    context.beginPath();
    if (g_dragging !== null && g_dragging.card_id == card.card_id) {
      context.strokeStyle = "blue";
    } else if (card.picker_id !== null) {
      context.strokeStyle = "red";
    } else {
      context.strokeStyle = "black";
    }
    context.rect(x, y, card.dw, card.dh);
    context.stroke();
  }

  /**
   * @fn draw_field
   * @brief 場を描画
   * @param context   [in] Canvas context
   */
  function draw_field(context, sorted_cards) {
    var region = g_regions.field;
    context.save();
    context.setTransform(1, 0, 0, 1, region.x, region.y);
    context.fillStyle = "green";
    context.fillRect(0, 0, region.w, region.h);
    for (var card_index = 0; card_index < sorted_cards.length; ++card_index) {
      var card = sorted_cards[card_index];
      if (card.owner_id !== null) continue;
      if (g_dragging !== null && g_dragging.card_id == card.card_id) continue;
      draw_card(context, card);
    }
    context.restore();
  }

  /**
   * @fn draw_hands
   * @brief 手札領域を描画
   * @param context   [in] Canvas context
   */
  function draw_hands(context, sorted_cards) {
    var region = g_regions.hands;
    context.save();
    context.setTransform(1, 0, 0, 1, region.x, region.y);
    context.fillStyle = "gray";
    context.fillRect(0, 0, region.w, region.h);
    for (var card_index = 0; card_index < sorted_cards.length; ++card_index) {
      var card = sorted_cards[card_index];
      if (card.owner_id != g_self_id) continue;
      if (g_dragging !== null && g_dragging.card_id == card.card_id) continue;
      draw_card(context, card);
    }
    context.restore();
  }

  /**
   * @fn draw_users
   * @brief 参加者リスト領域を描画
   * @param context   [in] Canvas context
   */
  function draw_users(context, sorted_cards) {
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
   * @retval null   対象無し
   * @return {card_id: 対象カードID, region: リージョン,
   *          xoffset: カードの左上へのXオフセット(≦0),
   *          yoffset: カードの左上へのYオフセット(≦0),
   *          z: カードのzオーダー}
   */
  function hittest_card(event){
    var rect = event.target.getBoundingClientRect();
    var mx = event.clientX - rect.left;
    var my = event.clientY - rect.top;
    var found = {card_id: null, region: null, xoffset: 0, yoffset: 0, z: 0};
    var region_hit = lookup_region(mx, my);
    if (region_hit === null) return found; // どの領域でもない
    found.region = region_hit;
    var mrx = region_hit.rx;
    var mry = region_hit.ry;

    for (var card_id in g_cards) {
      var card = g_cards[card_id];
      var region = get_card_region(card);
      if (region !== region_hit.region) continue;

      if (card.rx <= mrx && card.ry <= mry && mrx < (card.rx + card.dw) && mry < (card.ry + card.dh)) {
        if(found.card_id == null || found.z < card.z) {
          found.card_id = card_id;
          found.xoffset = card.rx - mrx;
          found.yoffset = card.ry - mry;
          found.z = card.z;
        }
      }
    }
    if (found.card_id != null) {
      var picker_id = g_cards[found.card_id].picker_id;
      if (picker_id !== null && picker_id != g_self_id) {
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
      socket.emit('give_semaphore', {user_id: g_self_id, receiver_user_id: user.user_id});
    }
    return true;
  }

});

// vim: et sts=2 sw=2:
