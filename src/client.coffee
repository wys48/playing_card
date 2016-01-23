#ifdef _CLIENT_
#
TAP_THRESHOLD_MS = 250
TAP_THRESHOLD_PX = 10

  # イベント呼び出しの優先度。数値が小さいほど先に呼び出される。
  # ここに記載されていないイベントは優先度0として扱う。
EVENT_PRIORITY = {touchstart: -1}

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

  myapp = new tm.display.CanvasApp("#canvas")

  myapp.fps = 20

  myapp.background = "#208020"
  myapp.resize(1280, 720) # 16:9
  #  myapp.fitWindow()
  myapp.__events = {}
  myapp.socket = socket

  myapp.postUpdate = ->
    #  console.log("baseapp.update")
    keys = (k for k, v of myapp.__events)
    keys.sort((a, b) -> (EVENT_PRIORITY[a] or 0) - (EVENT_PRIORITY[b] or 0))
    for key in keys
      val = myapp.__events[key]
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
      PC.Client.Syncable.startSync(socket)
      socket.emit("login")
      playScene.getScene()
  })
  socket.on("connect", ->
    myapp.selfid = socket.socket.sessionid
    $("#self").text("#{myapp.selfid}")
    myapp.replaceScene(loadingScene)
    myapp.run()
  )
  $("#reset-server").click(=>
    $("#reset-server").text("Requesting reset...")
    socket.emit("reset-server")
    window.setTimeout((=> window.location.reload()), 1000)
  )
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

$(->
  window.mylog = log

  $(".testclicker").bind("click", (event) ->
    log("#{this.id}::click")
  )
  $(".testclicker").bind("touchstart", (event) ->
    log("#{this.id}::touchstart")
  )
)

#endif
  # vim:et sts=2 sw=2
