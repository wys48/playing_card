/**
 * @file server.js
 * @brief サーバ側システムメイン
 */

// Dependencies
var express = require('express');
var app = express();
var server = require('http').createServer(app); // httpでラップしたserverがsocket.ioのために必要
var g_users = {};
var g_rooms = {};

// Socket.IO
var io = require('socket.io').listen(server);

app.configure(function () {
  // app.set('view options', {layout: false}); // 不要？
  app.use(express.static(__dirname + '/public'));
  app.use(express.bodyParser()); // req.bodyを生成させるために必要
});

/*
 * HTML ページ出力
 */

/**
 * @brief indexページの取得
 */
app.get('/', function(req, res) {
  res.render('index.ejs');
});

/**
 * @brief roomページの取得
 */
app.post('/room', function(req, res) {
  // ユーザ一覧への登録
  // (各ユーザのuser_idから参加中のroom_id等が引けるようにする)
  var nickname = req.body.nickname;
  var user_id = req.body.user_id;
  var room_id = req.body.room_id;
  var new_room = (room_id == "");
  if(new_room) room_id = user_id;
  g_users[user_id] = {user_id: user_id, nickname: nickname,
                      room_id: room_id,
                      role: (new_room ? "owner" : "user"),
                      state: "waiting"};

  if(new_room) {
    // 新規ルームの作成
    g_rooms[room_id] = {room_id: room_id, user_ids: [user_id],
                        room_name: nickname + "さんの部屋",
                        game: null};
  } else {
    // ルームへの参加
    // ASSERT(g_rooms[room_id]);
    g_rooms[room_id].user_ids.push(user_id);
  }
  notify_room_update();

  res.render('room.ejs', {locals: {room: g_rooms[room_id], user: g_users[user_id]}});
});

/**
 * @brief playページの取得
 */
app.post('/play', function(req, res) {
  var user_id = req.body.user_id;
  var user = g_users[user_id];
  var room_id = user.room_id;
  var room = g_rooms[room_id];
  if(room.game == null) {
    // ゲーム開始
    // TODO: 基本ルールのロック
    // FIXME: 神経衰弱限定のロジック
    cardset = {}
    imageset = {}
    for (var suit = 0; suit < 4; ++suit) {
      for (var num = 1; num <= 13; ++num) {
        var id = suit * 13 + num;
        cardset[id] = {card_id: id, image_ids: [-1, id], suit: suit, num: num,
                        owner_id: null, picker_id: null,
                        rx: 10 + 85 * (13 - num), ry: 10 + 128 * suit,
                        /*w: 60, h: 93,*/
                        z: id,
                        opened: false}
        imageset[id] = {x: 79 * (num - 1), y: 123 * suit, w: 79, h: 123}
      }
    }
    imageset[-1] = {x: 79, y: 123 * 4, w: 79, h: 123}
    var highest_z = 0.0;
    for (var card_id in cardset) {
      highest_z = Math.max(highest_z, cardset[card_id].z);
    }
    room.game = {cardset: cardset, imageset: imageset, highest_z: highest_z,
                  semaphore: {max: 1, owner: [user_id]}}
  }
  user.state = "playing";
  notify_user_update(room_id);
  res.render('play.ejs', {locals: {room: g_rooms[room_id], user: g_users[user_id]}});
});

// app.listenではなく、server.listenにする。
// (パス/socket.io/でjsが読めなくなる)
server.listen(3000);
console.log('server start:', 3000);

/**
 * @fn notify_room_update
 * @brief 各ユーザにルームの更新を通知
 */
function notify_room_update() {
  var roomlist = [];
  for (var room_id in g_rooms) {
    roomlist.push({room_id: room_id, room_name: g_rooms[room_id].room_name});
  }
  io.sockets.emit('update_room', roomlist);
}

/**
 * @fn notify_user_update
 * @brief 各ユーザに同一ルーム内のユーザの更新を通知
 * @param room_id   [in] 通知するルームのID
 */
function notify_user_update(room_id) {
  var room = g_rooms[room_id];
  var user_states = [];
  var sem = (room.game != null) ? room.game.semaphore : null;
  for (var i in room.user_ids) {
    var u = g_users[room.user_ids[i]];
    var is_owner = false;
    if (sem && sem.owner.indexOf(u.user_id) >= 0) {
      is_owner = true;
    }
    user_states.push({nickname: u.nickname, state: u.state, sem_owner: is_owner, user_id: u.user_id});
  }
  io.sockets.in(room_id).emit('update_user', user_states)
}

/**
 * @fn make_card_update
 * @brief update_card用の送信データを作成
 * @param game            [in] 対象ゲーム
 * @param card_ids_dict   [in] カードIDをキーにしたディクショナリ
 */
function make_card_update(game, card_ids_dict) {
  var cards = [];
  for (var card_id in card_ids_dict) {
    var card = game.cardset[card_id];
    var image = game.imageset[card.image_ids[card.opened ? 1 : 0]];
    cards.push({card_id: card_id, z: card.z,
                owner_id: card.owner_id, picker_id: card.picker_id,
                sx: image.x, sy: image.y, sw: image.w, sh: image.h,
                rx: card.rx, ry: card.ry, dw: image.w, dh: image.h});
  }
  return cards;
}

/**
 * @fn io.sockets.connection
 * @brief コネクション確立イベント処理
 */
io.sockets.on('connection', function(socket) {
  /**
   * @fn socket.on.enter_index
   * @brief クライアントがindexページに遷移したことを受信
   */
  socket.on('enter_index', function() {
    // ユーザIDを生成して通知する
    socket.emit('create_user_id', socket.id);
    notify_room_update();
    socket.emit('add_message', {name: "system", message: "welcome to online とらんぷ!", clear: true});
  });

  /**
   * @fn socket.on.enter_room
   * @brief クライアントがroomページに遷移したことを受信
   */
  socket.on('enter_room', function(user_id) {
    if(g_users[user_id] == undefined) return; // 無効ユーザのリクエストは拒否

    var room_id = g_users[user_id].room_id;
    socket.join(room_id);
    notify_user_update(room_id);
  });

  /**
   * @fn socket.on.enter_play
   * @brief クライアントがplayページに遷移したことを受信
   */
  socket.on('enter_play', function(user_id) {
    if(g_users[user_id] == undefined) return; // 無効ユーザのリクエストは拒否

    var room_id = g_users[user_id].room_id;
    socket.join(room_id);
    var game = g_rooms[room_id].game;
    if(game == null) return;
    socket.emit('update_card', make_card_update(game, game.cardset));
    notify_user_update(room_id);
  });

  /**
   * @fn socket.on.click_card
   * @brief カードがクリックされたときの処理
   */
  socket.on('click_card', function(params) {
    var user_id = params.user_id;
    if(g_users[user_id] == undefined) return; // 無効ユーザのリクエストは拒否

    var room_id = g_users[user_id].room_id;
    var game = g_rooms[room_id].game;
    if(game == null) return;
    var card = game.cardset[params.card_id];

    card.opened = !card.opened;
    var cards = {};
    cards[card.card_id] = null;
    io.sockets.in(room_id).emit('update_card', make_card_update(game, cards));
  });

  /**
   * @fn socket.on.pick_card
   * @brief カードが移動中になったときの処理
   */
  socket.on('pick_card', function(params) {
    var user_id = params.user_id;
    if(g_users[user_id] == undefined) return; // 無効ユーザのリクエストは拒否

    var room_id = g_users[user_id].room_id;
    var game = g_rooms[room_id].game;
    if(game == null) return;
    var card = game.cardset[params.card_id];

    card.picker_id = user_id;
    card.z = ++game.highest_z;
    var cards = {};
    cards[card.card_id] = null;
    io.sockets.in(room_id).emit('update_card', make_card_update(game, cards));
  });

  /**
   * @fn socket.on.move_card
   * @brief カードが移動完了したときの処理
   */
  socket.on('move_card', function(params) {
    var user_id = params.user_id;
    if(g_users[user_id] == undefined) return; // 無効ユーザのリクエストは拒否

    var room_id = g_users[user_id].room_id;
    var game = g_rooms[room_id].game;
    if(game == null) return;
    var card = game.cardset[params.card_id];

    card.rx = params.rx;
    card.ry = params.ry;
    card.picker_id = null;
    card.owner_id = params.owner_id;
    var cards = {};
    cards[card.card_id] = null;
    io.sockets.in(room_id).emit('update_card', make_card_update(game, cards));
  });

  /**
   * @fn socket.on.give_semaphore
   * @brief ユーザが別ユーザにセマフォを渡したときの処理
   */
  socket.on('give_semaphore', function(params) {
    var user_id = params.user_id;
    if(g_users[user_id] == undefined) return; // 無効ユーザのリクエストは拒否

    var room_id = g_users[user_id].room_id;
    var game = g_rooms[room_id].game;
    if(game == null) return;

    var sem = game.semaphore;
    var index = sem.owner.indexOf(user_id);
    if (index < 0) return; // 現在のセマフォ所有者でないため無視
    sem.owner.splice(index, 1);
    sem.owner.push(params.receiver_user_id);
    notify_user_update(room_id);
  });
});

// vim: et sts=2 sw=2:
