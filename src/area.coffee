PC = {} unless PC?
PC._SIDE_ = {} unless PC._SIDE_?

class PC._SIDE_.Area extends PC._SIDE_.Placeable
  ###*
  @class PC._SIDE_.Area
  @extends PC._SIDE_.Placeable
  カードを置く領域(_SIDE_ 側)

  @constructor
  コンストラクタ
  ###
  constructor: (properties) ->
    super(@constructor.name)
#ifdef _SERVER_
    {@_x, @_y, @_w, @_h} = properties
    @syncTarget.push("_x", "_y", "_w", "_h", "zorder", "userid")
#endif
#ifdef _CLIENT_
    @coord = new PC.Common.Coord(0, 0)
    @size = new PC.Common.Size(0, 0)
    @canput = true  # FIXME
    console.log(@_element = new tm.display.RoundRectangleShape())
    @_element.setBoundingType("rect")
    #  @_element.setFrameIndex(@kind)
    #  @_element.setPosition(@coord.x, @coord.y)
    @_element._this = this
    #  @_element.bgColor = "red"
    @_element.fillStyle = "transparent"
    @_element.strokeStyle = "gray"
    @_element.strokeWidth = 0.5
    @_element.setPosition(@coord.x, @coord.y)
    @_element.setSize(@size.w, @size.h)
    #  @_element.postDraw = (canvas) ->
    #    console.log("shape::postdraw")
    #    @drawBoundingRect(canvas, @strokeWidth)
    myapp.currentScene.addChild(@_element)
#endif

#ifdef _CLIENT_
  onSync: (properties) ->
    if (properties._x? or properties._y?)
      @coord.x = properties._x if properties._x?
      @coord.y = properties._y if properties._y?
      @_element.setPosition(@coord.x, @coord.y)
    if (properties._w? or properties._h?)
      @size.w = properties._w if properties._w?
      @size.h = properties._h if properties._h?
      @_element.setSize(@size.w, @size.h)
    if (properties.zorder != @zorder)
      # Zオーダー変更あり(自分の@_elementを一度親からはずす)
      parent = @_element.parent
      @_element.remove()
      @zorder = properties.zorder
      c = parent.children
      i = null
      for i in [0...(c.length)]
        break if c[i]._this.zorder > @zorder
      log("zorder:#{@zorder},newindex:#{i}")
      parent.addChildAt(@_element, i)
    if (properties.userid?)
      @userid = properties.userid
      switch @userid
        when myapp.selfid
          @_element.fillStyle = tm.graphics.Color.createStyleRGBA( 73, 111, 199, 1.0)
        when undefined
          @_element.fillStyle = "transparent"
        else
          @_element.fillStyle = tm.graphics.Color.createStyleRGBA(199,  73,  73, 1.0)
#endif

  PC._SIDE_.Syncable.extendedBy(this)

  ###*
  @method
  移動可能オブジェクトを中に置くことができるかを調べる
  @param {PC._SIDE_.Movable} movable
  @param {Function} callback
  ###
  canPutIn: (movable, callback) -> callback(@canput)

  # vim:et sts=2 sw=2
