PC = {} unless PC?
PC.Common = {} unless PC.Common?

class PC.Common.Stack extends PC.Common.Movable
  ###*
  @class PC.Common.Stack
  @extends PC.Common.Movable
  山札クラス(Client/Server共通部)

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
  @property {PC.Common.Placeable}
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
