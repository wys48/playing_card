PC = {} unless PC?
PC.Common = {} unless PC.Common?

class PC.Common.Movable extends PC.Common.Placeable
  ###*
  @class PC.Common.Movable
  @extends PC.Common.Placeable
  移動可能オブジェクトクラスの基底(Client/Server共通部)

  @constructor
  コンストラクタ
  ###
  constructor: ->

  ###*
  @method
  オブジェクトを持ち上げる
  @param {} picker
  @param {Function} callback
  ###
  pick: (picker, callback) ->

  ###*
  @method
  オブジェクトを置く
  @param {PC.Common.Placeable} placeable
  @param {PC.Common.Coord} coord
  @param {Function} callback
  ###
  put: (placeable, coord, callback) ->

  # vim:et sts=2 sw=2
