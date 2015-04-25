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

  io.sockets.on("connection", (socket) ->
    socket.on("login", (name) ->
      console.log("server:login")
      #card.sync(socket) for card in cards
    )
    socket.on("test", (properties) ->
      properties.kind = Math.floor(Math.random() * 13)
      properties.area = "hoge"
      console.log({"server:test": properties})
      c = new PC.Server.Card(properties)
      cards.push(c)
      c.setSyncDestination(io.sockets)
      c.sync()
    )
    PC.Server.Syncable.startSync(socket)
  )

#endif
  # vim:et sts=2 sw=2
