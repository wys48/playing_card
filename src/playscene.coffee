#ifdef _CLIENT_
PC = {} unless PC?
PC._SIDE_ = {} unless PC._SIDE_?
PC._SIDE_.Scenes = {} unless PC._SIDE_.Scenes?

class PC._SIDE_.Scenes.PlayScene #extends tm.app.Scene
  ###*
  @class PC._SIDE_.Scenes.PlayScene
  @extends tm.app.Scene
  ゲーム中シーン

  @constructor
  コンストラクタ
  ###
  constructor: ->
    #  super() null
    @scene = new tm.app.Scene()
    @scene.on("touchend", (event) ->
      myapp.eventFilter(event, ->
      #  as = new tm.display.AnimationSprite(PC.Client.Card.ss)
      #  as.setPosition(event.pointing.x, event.pointing.y)
      #  as.gotoAndPlay("normal1")
      #  @addChild(as)
        #  c = new PC.Client.Card(Math.floor(Math.random() * 13), event.pointing.x, event.pointing.y)
        console.log("client:test")
        myapp.socket.emit("test", {x: event.pointing.x, y: event.pointing.y})
      #  @clearEventListener("pointingend")
      )
    )
    @scene.checkHierarchy = true

  getScene: ->
    @scene

#endif
  # vim:et sts=2 sw=2