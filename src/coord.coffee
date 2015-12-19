(PC or= {}).Common or= {}

class PC.Common.Coord
  ###*
  @class PC.Common.Coord
  座標データ格納クラス(Server/Client共通)

  @constructor
  コンストラクタ
  ###
  constructor: (@x, @y) ->

  ###*
  矩形領域でHitTest
  @param {PC.Common.Coord}  coord   中心座標
  @param {PC.Common.Size}   size    サイズ
  ###
  hitTestRect: (coord, size) ->
    coord.x - size.w / 2 <= @x < coord.x + size.w / 2 and
      coord.y - size.h / 2 <= @y < coord.y + size.h / 2

