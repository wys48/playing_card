#ifdef _SERVER_
Node_UUID = require("node-uuid")
do ->
  express = require("express")
  app = express()
  server = require("http").createServer(app)  # httpでラップしたserverがsocket.ioのために必要
  io = require("socket.io").listen(server)
  app.configure(->
    # app.set('view options', {layout: false}); // 不要？
    console.log({test: __dirname + "/public"})
    app.use(express.static(__dirname + "/public"))
    app.use(express.bodyParser())   # req.bodyを生成させるために必要
  )
  server.listen(3000)
  console.log("server.listen() start")
  cards = []
  #  cards.push(new PC.Server.Movable(1234))
  #  cards.push(new PC.Server.Movable(5678))
  PC.Server.Syncable.sockets = io.sockets # FIXME:io.socketsをちゃんとSyncableに伝える仕組みがいりそう

  areas = []
  do ->
    w = 1280
    h = 720
    c = 140
    areas[0] = new PC.Server.Area({_x: w/2,   _y:h/2,   _w:w-c*2, _h:h-c*2})  # 場
    areas[1] = new PC.Server.Area({_x: w/2,   _y:h-c/2, _w:w-c*2, _h:c    })  # S
    areas[2] = new PC.Server.Area({_x: w/2,   _y:c/2,   _w:w-c*2, _h:c    })  # N
    areas[3] = new PC.Server.Area({_x: c/2,   _y:h/2,   _w:c,     _h:h    })  # W
    areas[4] = new PC.Server.Area({_x: w-c/2, _y:h/2,   _w:c,     _h:h    })  # E

  io.sockets.on("connection", (socket) ->
    socket.on("login", (name) ->
      console.log("server:login")
      # 特定のユーザログイン時、そのユーザに全カードの情報を送信する
      # FIXME:本当はログイン成功時にユーザから要求すべき
      PC.Server.Syncable.onSyncRequest(socket)
    )
    socket.on("test", (properties) ->
      properties.kind = Math.floor(Math.random() * 13)
      properties.area = "hoge"
      console.log({"server:test": properties})
      c = new PC.Server.Card(properties)
      cards.push(c)
      # 特定のカードの新規作成は、全ユーザに情報を送信する
      PC.Server.Syncable.sendObjects(io.sockets, [c.uuid])
    )
    socket.on("reset-server", =>
      process.exit()
    )
    PC.Server.Syncable.startSync(socket)
  )

#endif
  # vim:et sts=2 sw=2
