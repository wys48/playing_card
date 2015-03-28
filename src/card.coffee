PC = {} unless PC?
PC._SIDE_ = {} unless PC._SIDE_?

class PC._SIDE_.Card extends PC._SIDE_.Movable
  ###*
  @class PC._SIDE_.Card
  @extends PC._SIDE_.Movable
  カードクラス(_SIDE_ 側)

  @constructor
  コンストラクタ
  ###
  constructor: (properties) ->
    console.log(properties)
    super(@constructor.name)
    @kind = properties.kind
    @area = properties.area
#ifdef _SERVER_
    # FIXME
    @x = properties.x
    @y = properties.y
#endif
#ifdef _CLIENT_
    @coord = new PC.Common.Coord(properties.x, properties.y)
#endif
    @picker = null
#ifdef _SERVER_
    @syncTarget.push("kind", "area", "x", "y", "picker")
#endif
#ifdef _CLIENT_
    @_element = new tm.display.Sprite("cards", 79, 123)
    @_element.setBoundingType("rect")
    @_element.setFrameIndex(@kind)
    @_element.setPosition(@coord.x, @coord.y)
    @_element._this = this
    @_element._drag = null
    @_element.strokeStyle = "black"
    @_element.strokeWidth = 1
    @_element.postDraw = (canvas) -> @drawBoundingRect(canvas, @strokeWidth)
    @_element.on('click', (event) ->
      myapp.eventFilter(event, ->
        log("card clicked" + event.target._this.kind)
      )
    )
    @place = myapp.playScene.area1

    @_element.on('touchstart', (event) =>
      myapp.eventFilter(event, =>
        @pick({callback: (accepted) =>
          return unless accepted
          @_drag = {x: event.pointing.x - @_element.x, y: event.pointing.y - @_element.y}
          log("touchstart on " + @kind + " (" + @_drag.x + "," + @_drag.y + ")")
          @refreshBorder()
        })
      )
    )
    @_element.on('touchmove', (event) =>
      myapp.eventFilter(event, =>
        return unless @_drag
        x = event.pointing.x - @_drag.x
        y = event.pointing.y - @_drag.y
        if @_element.x != x or @_element.y != y
          @_element.setPosition(x, y)
        log("touchmove on " + @kind)
      )
    )
    @_element.on('touchend', (event) =>
      myapp.eventFilter(event, =>
        return unless @_drag
        @_drag = null
        cancel = =>
          log("move canceled")
          @_element.setPosition(@coord.x, @coord.y)
          @refreshBorder()
        newCoord = new PC.Common.Coord(@_element.x, @_element.y)
        place = (p for p in myapp.playScene.area when newCoord.hitTestRect(p.coord, p.size))[0]
        console.log("no place") unless place
        place or= {canPutIn: (dummy, callback) -> callback(false)}
        place.canPutIn(this, (canputin) =>
          newCoord = null unless canputin
          @put({callback: (accepted) =>
            console.log("hoge222")
            return cancel() unless accepted
            console.log("hoge333")
            @place = place
          }, null, if newCoord then {x: newCoord.x, y: newCoord.y} else null)
        )
        #  log("touchend on " + event.target._this.kind + " (" + event.pointing.x + "," + event.pointing.y + ")")
      )
    )
    @_element.setInteractive(true)
    @_element.checkHierarchy = true
    myapp.currentScene.addChild(@_element)
#endif

  PC._SIDE_.Syncable.extendedBy(this)

#ifdef _CLIENT_
  onSync: (properties) ->
    console.log({onSync: properties})
    if (properties.kind)
      @kind = properties.kind
      @_element.setFrameIndex(@kind)
    if (properties.x or properties.y)
      @coord.x = properties.x or @coord.x
      @coord.y = properties.y or @coord.y
      @_element.setPosition(@coord.x, @coord.y)
    if (properties.picker != @picker)
      @picker = properties.picker
      @refreshBorder()

  refreshBorder: ->
    if @_drag
      @_element.strokeStyle = "blue"
      @_element.strokeWidth = 3
    else if @picker
      @_element.strokeStyle = "red"
      @_element.strokeWidth = 3
    else
      @_element.strokeStyle = "black"
      @_element.strokeWidth = 1

#endif

  @sandbox_run: ->

  ###*
  @property {Boolean}
  カードが表向きか否か
  ###
  isOpened: null

  ###*
  @method
  カードを裏返す
  @param {Function} callback
  ###
  reverse: (callback) ->

  ##ifdef CLIENT
  #  ###*
  #  @private
  #  デッキの全てのカード画像を並べたテクスチャ
  #  ###
  #  decktexture = null
  ##endif

#ifdef _SERVER_
  ###*
  @method
  オブジェクトが持ち上げ可能かどうかを判定する
  @return {Boolean}
  ###
  canPick: (picker) ->
    result = (@picker or picker) == picker

  ###*
  @method
  オブジェクトが持ち上げられた時の動作を行う
  @param {PC._SIDE_.Player} picker
  ###
  onPickedUp: (@picker) ->
    console.log("onPickedUp: #{@picker}")
    @sync()

  # FIXME: placeableをちゃんと実装したうえで、onPutIn等で実装すべき
  put: (context, placeable, coord) ->
    if coord
      @x = coord.x
      @y = coord.y
    @picker = null
    @sync()
    console.log("server put:" + this)
    context.callback(true)
#endif

  # vim:et sts=2 sw=2
