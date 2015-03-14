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
    @_element = null

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
#ifdef _CLIENT_
  @param {Function} callback
#endif
  ###
  bringToFront: (callback) ->
#ifdef _SERVER_
    #  return false
    return true
#endif
#ifdef _CLIENT_
    callback or= -> null
    return callback(false) unless @_element
    parent = @_element.parent
    return callback(false) unless parent
    @requestServer("bringToFront", null, (result) =>
      return callback(false) unless result
      @_element.remove()
      parent.addChild(@_element)
      callback(true)
    )
#endif

  # vim:et sts=2 sw=2
