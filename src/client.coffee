#ifdef _CLIENT_
#
window.debug = {}
myapp = null
tm.preload( ->
  # PC.Client.Card.ss = tm.asset.SpriteSheet {
  #   image: "images/cards_trump.png",
  #   #       ↑asset.Managerでの管理名称(なかったらファイル名だと思って勝手に読み込んで登録される)
  #   frame: {width: 79, height: 123},
  #   #       ↑1要素当たりの幅と高さ
  #   animations: {
  #     normal0: {frames: [0, 13, 26, 39], next: "normal0", frequency: 1},
  #   }
  # }
)
tm.main( ->
  socket = io.connect()
  socket.on("connect", ->
    socket.emit("login")
    PC.Client.Syncable.startSync(socket)
    socket.emit("sync.request")
  )
  #  PC.Client.Syncable.sync(socket)

  myapp = new tm.display.CanvasApp("#canvas")
  #  myapp.fps = 240
  myapp.background = "#208020"
  myapp.resize(1280, 720)
  #  myapp.fitWindow()
  myapp.__events = {}
  myapp.socket = socket

  myapp.postUpdate = ->
    #  console.log("baseapp.update")
    for key,val of myapp.__events
      e = val[val.length - 1]
      e.callback.call(e.event.target, e.event)
    myapp.__events = {}

  window.debug.myapp = myapp
  window.debug.PC = PC

  old_method = tm.app.BaseApp.prototype._update
  tm.app.BaseApp.prototype._update = ->
    old_method.call(this)
    this.postUpdate() if this.postUpdate

  myapp.eventFilter = (e, callback) ->
    myapp.__events[e.type] or= []# unless myapp.__events[e.type]
    myapp.__events[e.type].push({event: e, callback: callback})

  playScene = new PC.Client.Scenes.PlayScene()
  myapp.playScene = playScene # FIXME
  loadingScene = new tm.ui.LoadingScene({
    assets: {
      cards: "images/cards_trump.png",
    },
    nextScene: ->
      playScene.getScene()
  })
  myapp.replaceScene(loadingScene)
  myapp.run()
)

hookMethod = (before, original, after) ->
  return ->
    before(arguments) if before
    original(arguments)
    after(arguments) if after

logno = 0

log = (message) ->
  #  return
  console.log(message)
  c = $('#console')
  logno = logno + 1
  c.append($('<option>').text(message).val(logno))
  c.val(logno)

#endif
  # vim:et sts=2 sw=2
