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
app.get('/', function(req, res) {
  console.log('---- / get -------------------------------------------------');
  res.render('index.ejs');
});
app.post('/room', function(req, res) {
  console.log('---- /room post --------------------------------------------');
  // console.log(req.body);

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
app.post('/play', function(req, res) {
  console.log('---- /play post --------------------------------------------');
  var user_id = req.body.user_id;
  var room_id = req.body.room_id;
  var user = g_users[user_id];
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
                        user: null, picker: null,
                        x: 10 + 85 * (13 - num), y: 10 + 128 * suit,
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

var games = {};

function notify_room_update() {
  var roomlist = [];
  for (var room_id in g_rooms) {
    roomlist.push({room_id: room_id, room_name: g_rooms[room_id].room_name});
  }
  console.log(roomlist);
  io.sockets.emit('room_update', roomlist);
}

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
  io.sockets.in(room_id).emit('user_update', user_states)
}

function make_card_update(game, card_ids_dict) {
  var cards = [];
  for (var card_id in card_ids_dict) {
    var card = game.cardset[card_id];
    var image = game.imageset[card.image_ids[card.opened ? 1 : 0]];
    cards.push({card_id: card_id, z: card.z, picker: card.picker,
                sx: image.x, sy: image.y, sw: image.w, sh: image.h,
                dx: card.x, dy: card.y, dw: image.w, dh: image.h});
  }
  return cards;
}

io.sockets.on('connection', function(socket) {
  socket.on('enter_index', function() {
    console.log('---- enter_index -------------------------------------------');
    socket.emit('user_id', socket.id);
    notify_room_update();
    socket.emit('post', {name: "system", message: "welcome to online とらんぷ!", clear: true});
  });

  socket.on('enter_room', function(user_id) {
    console.log('---- enter_room --------------------------------------------');
    if(g_users[user_id] == undefined) return; // 無効ユーザのリクエストは拒否
    var room_id = g_users[user_id].room_id;
    socket.join(room_id);
    notify_user_update(room_id);
  });

  socket.on('start_play', function(user_id) {
    console.log('---- start_play --------------------------------------------');
    if(g_users[user_id] == undefined) return; // 無効ユーザのリクエストは拒否
    var room_id = g_users[user_id].room_id;
    socket.join(room_id);
    var game = g_rooms[room_id].game;
    if(game == null) return;
    socket.emit('card_update', make_card_update(game, game.cardset));
    notify_user_update(room_id);
  });

  socket.on('card_click', function(params) {
    console.log('---- card_click --------------------------------------------');
    console.log(params);
    var user_id = params.user_id;
    if(g_users[user_id] == undefined) return; // 無効ユーザのリクエストは拒否
    var room_id = g_users[user_id].room_id;
    var game = g_rooms[room_id].game;
    if(game == null) return;
    var card = game.cardset[params.card_id];
    card.opened = !card.opened;
    var cards = {};
    cards[card.card_id] = null;
    io.sockets.in(room_id).emit('card_update', make_card_update(game, cards));
  });

  socket.on('card_pick', function(params) {
    console.log('---- card_pick ---------------------------------------------');
    console.log(params);
    var user_id = params.user_id;
    if(g_users[user_id] == undefined) return; // 無効ユーザのリクエストは拒否
    var room_id = g_users[user_id].room_id;
    var game = g_rooms[room_id].game;
    if(game == null) return;
    var card = game.cardset[params.card_id];
    card.picker = user_id;
    console.log(game.highest_z);
    card.z = ++game.highest_z;
    var cards = {};
    cards[card.card_id] = null;
    io.sockets.in(room_id).emit('card_update', make_card_update(game, cards));
    console.log("emit!");
  });

  socket.on('card_move', function(params) {
    console.log('---- card_move ---------------------------------------------');
    console.log(params);
    var user_id = params.user_id;
    if(g_users[user_id] == undefined) return; // 無効ユーザのリクエストは拒否
    var room_id = g_users[user_id].room_id;
    var game = g_rooms[room_id].game;
    if(game == null) return;
    var card = game.cardset[params.card_id];
    card.x = params.x;
    card.y = params.y;
    card.picker = null;
    var cards = {};
    cards[card.card_id] = null;
    io.sockets.in(room_id).emit('card_update', make_card_update(game, cards));
    console.log("emit!");
  });

  socket.on('sem_give', function(params) {
    console.log('---- sem_give ----------------------------------------------');
    console.log(params);
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

function validate_check(g, data) {
  return (data.color === g.turn);
}

function init_game(g) {
  g.grids = new Array(g.gridnum);
  for(var x = 0; x < g.gridnum; x++) {
    g.grids[x] = new Array(g.gridnum);
    for(var y = 0; y < g.gridnum; y++) {
      g.grids[x][y] = null;
    }
  }
  g.grids[3][3] = "white";
  g.grids[3][4] = "black";
  g.grids[4][3] = "black";
  g.grids[4][4] = "white";
  g.turn = "black";
  g.started = true;
}

function place(g, x, y){
  console.log('place()')
  if(x < 0 || x >= g.gridnum || y < 0 || y >= g.gridnum ||
      g.grids[x][y] !== null || reverse(g, x, y, false) === 0){
    return;
  }
  g.grids[x][y] = g.turn;
  switch_turn(g);
}

function reverse(g, x, y, judge_only){
  var sx, sy;
  var totalnum = 0;
  for(sy = -1; sy <= 1; ++sy){
    for(sx = -1; sx <= 1; ++sx){
      if(sx === 0 && sy === 0) continue;
      var i = reverse_line(g, sx, sy, x, y, judge_only);
      console.log("sx=" + sx + ",sy=" + sy + ",result=" + i);
      totalnum += i;
    }
  }
  return totalnum;
}

function reverse_line(g, sx, sy, x, y, judge_only){
  var x2 = x + sx, y2 = y + sy;
  var num = 0;
  while(x2 >= 0 && x2 < g.gridnum && y2 >= 0 && y2 < g.gridnum){
    if(g.grids[x2][y2] === null){
      return 0;
    }else if(g.grids[x2][y2] == g.turn){
      if(!judge_only && num > 0){
        while(x2 != x || y2 != y){
          x2 -= sx;
          y2 -= sy;
          g.grids[x2][y2] = g.turn;
        }
      }
      return num;
    }else{
      ++num;
    }
    x2 += sx;
    y2 += sy;
  }
  return 0;
}

function switch_turn(g){
  g.turn = (g.turn == "black") ? "white" : "black";
}

// vim: et sts=2 sw=2:
