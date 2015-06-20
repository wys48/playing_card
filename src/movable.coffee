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
    super
#ifdef _SERVER_
    #  @hoge = test
    #  @syncTarget.push("hoge")
#endif

  PC._SIDE_.Syncable.extendedBy(this)

  ###*
  @method
  オブジェクトを持ち上げる
#ifdef _SERVER_
  @param {PC._SIDE_.Player} context.requester
#endif
  @param {Function} context.callback (boolean accepted)
  ###
  pick: (context) ->
#ifdef _CLIENT_
    @rpcCall("pick")
#endif
#ifdef _SERVER_
    callback = context.callback
    requester = context.requester
    return callback(false) unless @canPick(requester)
    @onPickedUp(requester)
    callback(true)
#endif

  ###*
  @method
  オブジェクトを置く
#ifdef _SERVER_
  @param {PC._SIDE_.Player} context.requester
#endif
  @param {Function} context.callback (boolean accepted)
  @param {PC._SIDE_.Placeable} placeable
  @param {PC.Common.Coord} coord
  ###
  put: (context, placeable, coord) ->
#ifdef _CLIENT_
    @rpcCall("put")
#endif
#ifdef _SERVER_
    callback = context.callback
    requester = context.requester
    # if @container != placeable
    #   return callback(false) unless placeable.canPutIn(this)
    #  placeable.onPutIn(requester, )
    callback(true)
#endif

#ifdef _SERVER_
  ###*
  @method
  オブジェクトが持ち上げ可能かどうかを判定する
  @return {Boolean}
  ###
  canPick: (picker) ->
    false

  ###*
  @method
  オブジェクトが持ち上げられた時の動作を行う
  @param {PC._SIDE_.Player} picker
  ###
  onPickedUp: (picker) ->
    null
#endif

  ###*
  @property {PC._SIDE_.Placeable}
  所属
  ###
  place: null

  ###*
  @property {Number} relativeX
  所属領域内の正規化相対X座標
  ###
#ifdef _CLIENT_
  @property("relativeX",
    get: ->
      return null unless @place
      (@coord.x - @place.coord.x) / @place.size.w
    set: (value) ->
      return unless @place
      @coord.x = (value * @place.size.w) + @place.coord.x
  )
#endif
#ifdef _SERVER_
  relativeX: null
#endif

  ###*
  @property {Number} relativeY
  所属領域内の正規化相対Y座標
  ###
#ifdef _CLIENT_
  @property("relativeY",
    get: ->
      return null unless @place
      (@coord.y - @place.coord.y) / @place.size.h
    set: (value) ->
      return unless @place
      @coord.y = (value * @place.size.h) + @place.coord.y
  )
#endif
#ifdef _SERVER_
  relativeY: null
#endif

  ###*
  @property {Number}
  カードのZオーダー(大きいほど前面)
  ###
  zorder: null

  # vim:et sts=2 sw=2
