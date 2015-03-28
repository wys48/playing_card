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
    @coord = new PC.Common.Coord(x + w/2, y + h/2)
    @size = new PC.Common.Size(w, h)
    @canput = canput

  ###*
  @method
  移動可能オブジェクトを中に置くことができるかを調べる
  @param {PC._SIDE_.Movable} movable
  @param {Function} callback
  ###
  canPutIn: (movable, callback) -> callback(@canput)

  # vim:et sts=2 sw=2
