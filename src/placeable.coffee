PC = {} unless PC?
PC._SIDE_ = {} unless PC._SIDE_?

class PC._SIDE_.Placeable
  ###*
  @class PC._SIDE_.Placeable
  移動可能オブジェクトを置くことのできるクラスの基底(_SIDE_ 側)

  @constructor
  コンストラクタ
  ###
  constructor: ->

  ###*
  @method
  移動可能オブジェクトを中に置くことができるかを調べる
  @param {PC._SIDE_.Movable} movable
  @param {Function} callback
  ###
  canPutIn: (movable, callback) ->

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

  # vim:et sts=2 sw=2
