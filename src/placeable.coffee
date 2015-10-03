PC = {} unless PC?
PC._SIDE_ = {} unless PC._SIDE_?

class PC._SIDE_.Placeable extends PC._SIDE_.Syncable
  ###*
  @class PC._SIDE_.Placeable
  移動可能オブジェクトを置くことのできるクラスの基底(_SIDE_ 側)

  @constructor
  コンストラクタ
  ###
  constructor: ->
    super
#ifdef _SERVER_
    # 生成時は、自動的に最前面のオブジェクトとする
    @zorder = (@constructor.maxZorder += 1)
#endif
#ifdef _CLIENT_
    # @
#endif

  PC._SIDE_.Syncable.extendedBy(this)

  ###*
  @method
  移動可能オブジェクトを中に置くことができるかを調べる
  @param {PC._SIDE_.Movable} movable
  @param {Function} callback
  ###
  canPutIn: (movable, callback) -> callback(false)

  ###*
  @method
  移動可能オブジェクトが中に置かれた
  @param {PC._SIDE_.Movable} movable
  @param {Function} callback
  ###
  onPutIn: (movable, callback) ->

  ###*
  @method
  移動可能オブジェクトを外に出すことができるかを調べる
  @param {PC._SIDE_.Movable} movable
  @param {Function} callback
  ###
  canPutOut: (movable, callback) ->

  ###*
  @method
  移動可能オブジェクトが外に出された
  @param {PC._SIDE_.Movable} movable
  @param {Function} callback
  ###
  onPutOut: (movable, callback) ->

  ###*
  @method
  オブジェクトを画面の最前面に移動する
#ifdef _SERVER_
  @param {PC._SIDE_.Player} context.requester
#endif
  @param {Function} context.callback (boolean accepted)
  ###
  bringToFront: (context) ->
#ifdef _CLIENT_
    @rpcCall("bringToFront")
#endif
#ifdef _SERVER_
    callback = context?.callback
    @zorder = (@constructor.maxZorder += 1)
    callback?(true)
#endif

#ifdef _CLIENT_
  ###*
  @property {PC.Common.Coord}
  領域中心点のキャンバス座標
  ###
  coord: null

  ###*
  @property {PC.Common.Size}
  領域のキャンバス座標系サイズ
  ###
  size: null
#endif

  ###*
  @property {Integer}
  Zオーダー(大きいほど手前)
  ###
  zorder: null

#ifdef _SERVER_
  ###*
  @static
  @property {Integer}
  Zオーダーの最大番号
  ###
  @maxZorder: 0
#endif

  # vim:et sts=2 sw=2
