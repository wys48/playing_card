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
  constructor: (x, y, w, h, canput = true) ->
    super
    @coord = new PC.Common.Coord(x + w/2, y + h/2)
    @size = new PC.Common.Size(w, h)
    @canput = canput
#ifdef _CLIENT_
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

  ###*
  @method
  移動可能オブジェクトを中に置くことができるかを調べる
  @param {PC._SIDE_.Movable} movable
  @param {Function} callback
  ###
  canPutIn: (movable, callback) -> callback(@canput)

  # vim:et sts=2 sw=2
