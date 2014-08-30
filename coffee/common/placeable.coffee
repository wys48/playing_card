PC = {} unless PC?
PC.Common = {} unless PC.Common?

class PC.Common.Placeable
  ###*
  @class PC.Common.Placeable
  移動可能オブジェクトを置くことのできるクラスの基底(Client/Server共通部)

  @constructor
  コンストラクタ
  ###
  constructor: ->

  ###*
  @method
  移動可能オブジェクトを中に置くことができるかを調べる
  @param {PC.Common.Movable} movable
  @param {Function} callback
  ###
  canPutIn: (movable, callback) ->

  ###*
  @method
  移動可能オブジェクトが中に置かれた
  @param {PC.Common.Movable} movable
  @param {Function} callback
  ###
  onPutIn: (movable, callback) ->

  ###*
  @method
  移動可能オブジェクトを外に出すことができるかを調べる
  @param {PC.Common.Movable} movable
  @param {Function} callback
  ###
  canPutOut: (movable, callback) ->

  ###*
  @method
  移動可能オブジェクトが外に出された
  @param {PC.Common.Movable} movable
  @param {Function} callback
  ###
  onPutOut: (movable, callback) ->

  # vim:et sts=2 sw=2
