PC = {} unless PC?
PC._SIDE_ = {} unless PC._SIDE_?

class PC._SIDE_.Movable extends PC._SIDE_.Placeable
  ###*
  @class PC._SIDE_.Movable
  @extends PC._SIDE_.Placeable
  移動可能オブジェクトクラスの基底(_SIDE_ 側)

  @constructor
  コンストラクタ
  ###
  constructor: ->

  ###*
  @method
  オブジェクトを持ち上げる
  @param {PC._SIDE_.Player} picker
  @param {Function} callback
  ###
  pick: (picker, callback) ->

  ###*
  @method
  オブジェクトを置く
  @param {PC._SIDE_.Placeable} placeable
  @param {PC.Common.Coord} coord
  @param {Function} callback
  ###
  put: (placeable, coord, callback) ->

  # vim:et sts=2 sw=2
