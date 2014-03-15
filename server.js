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

function array_shuffle(array) {
  var i = array.length;
  while(i){
    var j = Math.floor(Math.random()*i);
    var t = array[--i];
    array[i] = array[j];
    array[j] = t;
  }
  return array;
}

function sequence(first, last, step) {
  var r = [];
  if(step === undefined) step = 1;
  for(var i = first; i <= last; i += step) {
    r.push(i)
  }
  return r;
}

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
  // if(new_room) room_id = user_id;
  if(new_room) room_id = "r@" + user_id;
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
    // var ids = Array.apply(null, {length: 4 * 13}).map(Number.call, Number);
    // /* ↑さすがに分かりにくいので却下 */
    var ids = array_shuffle(sequence(1, 4 * 13));
    console.log('shuffled: ', ids);
    for (var suit = 0; suit < 4; ++suit) {
      for (var num = 1; num <= 13; ++num) {
        var id = suit * 13 + num;
        cardset[id] = {card_id: id, image_ids: [-1, ids[id - 1]],
                        owner_id: null, picker_id: null,
                        rx: 10 + 85 * (13 - num), ry: 10 + 128 * suit,
                        dw: 79, dh: 123, z: id, opened: false}
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
  console.log(roomlist);
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
  console.log('notify_user_update', g_users);
  console.log('notify_user_update_2', room.user_ids);
  for (var i in room.user_ids) {
    var u = g_users[room.user_ids[i]];
    var is_owner = false;
    if(sem && sem.owner.indexOf(u.user_id) >= 0) {
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
 * @param target_user_id  [in] 送信先ユーザID
 */
function make_card_update(game, card_ids_dict, target_user_id) {
  var cards = [];
  for (var card_id in card_ids_dict) {
    var card = game.cardset[card_id];
    var side = card.opened ? 1 : 0;
    if(card.owner_id !== null && card.owner_id != target_user_id) {
      side = 1 - side;
    }
    cards.push({card_id: card_id, z: card.z,
                owner_id: card.owner_id, picker_id: card.picker_id,
                rx: card.rx, ry: card.ry, dw: card.dw, dh: card.dh,
                image_id: card.image_ids[side]});
  }
  return cards;
}

/**
 * @fn broadcast_card_update
 * @brief 全ユーザにカードの更新情報を送信
 * @param room            [in] 対象ルーム
 * @param card_ids_dict   [in] カードIDをキーにしたディクショナリ
 */
function broadcast_card_update(room, card_ids_dict) {
  var user_ids = room.user_ids;
  for(var i in user_ids) {
    var user_id = user_ids[i];
    io.sockets.in(user_id).emit('update_card',
      make_card_update(room.game, card_ids_dict, user_id));
    console.log('broadcast_card_update to ' + user_id, card_ids_dict);
  }
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
    socket.join(user_id);
    var game = g_rooms[room_id].game;
    if(game == null) return;
    socket.emit('register_imageset', game.imageset);
    socket.emit('update_card', make_card_update(game, game.cardset, user_id));
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
    broadcast_card_update(g_rooms[room_id], cards);
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
    broadcast_card_update(g_rooms[room_id], cards);
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
    broadcast_card_update(g_rooms[room_id], cards);
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
    if(index < 0) return; // 現在のセマフォ所有者でないため無視
    sem.owner.splice(index, 1);
    sem.owner.push(params.receiver_user_id);
    notify_user_update(room_id);
  });
});

// vim: et sts=2 sw=2:
