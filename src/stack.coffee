PC = {} unless PC?
PC._SIDE_ = {} unless PC._SIDE_?

class PC._SIDE_.Stack extends PC._SIDE_.Movable
  ###*
  @class PC._SIDE_.Stack
  @extends PC._SIDE_.Movable
  山札クラス(_SIDE_ 側)

  @constructor
  コンストラクタ
  ###
  constructor: ->

  ###*
  @property {PC.Common.Coord}
  エリア内の正規化相対座標
  ###
  coord: ->

  ###*
  @property {Number}
  カードのZオーダー(大きいほど前面)
  ###
  zorder: ->

  ###*
  @property {PC._SIDE_.Placeable}
  所属
  ###
  place: ->

  ###*
  @method
  カードを裏返す
  @param {Function} callback
  ###
  reverse: (callback) ->

  # vim:et sts=2 sw=2
