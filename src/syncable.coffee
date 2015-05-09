PC = {} unless PC?
PC._SIDE_ = {} unless PC._SIDE_?
Function::property = (prop, desc) ->
  Object.defineProperty @prototype, prop, desc

  ###
  (1) Syncableオブジェクトのインスタンス生成について
  新規のインスタンス生成は、すべてサーバ側で行う。クライアント側で生成して
  サーバにコピーすることは出来ない。クライアントは、先にサーバ側で生成された
  インスタンスの同期結果としてのみ、新規のインスタンスを得ることができる。

  (2) Syncableオブジェクトのイベント通知について(Client→Server)
                              ----A--->
  clientInstance.onFooEvent()           serverInstance.onFooEvent()
                              <---B----

    A) クライアントは、通知前に何らかのアクションを行い、
       そもそも通知をするか否かを選択することが出来る。

    B) サーバは、(通知された場合)それに対するアクションを行い、
       その結果をクライアントに返却しなければならない。
  ###

class PC._SIDE_.Syncable
  ###*
  @class PC._SIDE_.Syncable
  サーバ/クライアント間で同期可能なオブジェクトの基底クラス

  @constructor
  コンストラクタ
  ###
  constructor: (@className) ->
#ifdef _SERVER_
    @syncTarget or= []
    @uuid = Node_UUID.v4()
    console.log("new:#{@uuid}")
    PC._SIDE_.Syncable.map[@uuid] = this
#endif
#ifdef _CLIENT_
#endif

  ###*
  JSONへの変換でUUIDに置換する
  ###
  toJSON: () -> {"__uuid__": @uuid}

  ###*
  @property
  UUIDからクラスのインスタンスを参照するためのマップ
  ###
  @map: {}

  @subclasses: {}
  @extendedBy: (subclass) -> @subclasses[subclass.name] = subclass

#ifdef _SERVER_
  #  setSyncDestination: (socket) ->
  #    @syncDestination = socket
#endif

#ifdef _SERVER_
  ###*
  ###
  #  sync: (socket) ->
  #    # TODO:通知して良いかの判定
  #    @syncDestination.emit("sync", {className: @className, uuid: @uuid, properties: @buildSyncProperties()})
  generateJSONforUser: (user) ->
    r = @buildSyncProperties()
    r.__classname__ = @constructor.name
    return r
#endif

  ###*
  JSON経由で受信したデータのUUIDをクラス参照に変換する
  ###
  @convertXref: (data) ->
    if data.__uuid__?
      throw "hogehoge"
    process = (item, index) =>
      if item?.__uuid__?
        data[index] = @map[item.__uuid__]
        #  throw "No class instance (TODO)" unless data[index]
      else if item instanceof Object
        @convertXref(item)
      null
    if data instanceof Array
      process(item, index) for item, index in data
    else if data instanceof Object
      process(value, key) for key, value of data
    null

  ###*
  すべてのSyncableオブジェクトに対する同期を始める
  ###
  @startSync: (socket) ->
#ifdef _SERVER_
    socket.on("rpc.call", (arg) => @onRpcCall(socket, arg))
    socket.on("sync.request", (arg) => @onSyncRequest(socket, arg))
#endif
#ifdef _CLIENT_
    socket.on("rpc.return", (arg) => @onRpcReturn(arg))
    socket.on("sync.update", (arg) => @onSyncUpdate(arg))
#endif
#ifdef _SERVER_
  ###*
  @private
  ClientからのRPC要求を実行する
  @param {io.socket}  socket    送信先ソケット
  @param {String}     rpc.uuid  インスタンス(要するにthis)のUUID
  @param {String}     rpc.func  呼び出す関数名
  @param {Array}      rpc.args  引数(ただしクラス参照はUUID化されている)
  @param {String}     rpc.tag   Client側でRPC要求を区別するためのタグ情報(rpc.return時に付加される)
  ###
  @onRpcCall: (socket, rpc) ->
    console.log("Info: RPC #{rpc.uuid}.#{rpc.func} with #{rpc.args.length} arguments")

    # 実行対象の取得とチェック
    instance = @map[rpc.uuid]
    unless instance
      console.log("Error: Object #{rpc.uuid} does not exist!")
      return
    func = instance[rpc.func]
    unless func
      console.log("Error: Object #{rpc.uuid} does not have `#{rpc.func}'")
      return

    # 引数のUUID化をクラス参照に変換
    PC._SIDE_.Syncable.convertXref(rpc.args)

    # (Clientとプロトタイプを揃えるため)戻り値設定のcallbackを準備
    res = {tag: rpc.tag, result: null}
    context =
      requester: socket.id  # FIXME
      callback: (result) -> res.result = result

    # 実行
    func.apply(instance, [context].concat(rpc.args))

    # 実行結果の返却
    socket.emit("rpc.return", res)

  ###*
  @private
  Clientからの全オブジェクト送信要求を処理する
  @param {io.socket}  socket  送信先ソケット
  ###
  @onSyncRequest: (socket) ->
    console.log("Info: onSyncRequest")
    @sendObjects(socket, Object.keys(@map))

  ###*
  @private
  指定されたUUIDのオブジェクト内容を送信する
  @param {io.socket}  socket  送信先ソケット
  @param {String[]}   uuids   送信するオブジェクトのUUIDの配列
  ###
  @sendObjects: (socket, uuids) ->
    data = {}
    for uuid in uuids
      instance = @map[uuid]
      throw "No instance" unless instance
      data[uuid] = instance.generateJSONforUser(socket.id)
    socket.emit("sync.update", data)
#endif

#ifdef _CLIENT_
  ###*
  @private
  Serverへ要求したRPCの実行結果を処理する
  @param {String} rpc.tag     RPC要求時に指定したタグ情報
  @param {String} rpc.result  戻り値(ただしクラス参照はUUID化されている)
  ###
  @onRpcReturn: (rpc) ->
    callback = @rpcRequests[rpc.tag]
    delete @rpcRequests[rpc.tag]
    PC._SIDE_.Syncable.convertXref(rpc.result)
    callback?(rpc.result)

  ###*
  @private
  Serverから受信したオブジェクトの情報でClient内のインスタンスを更新する
  ###
  @onSyncUpdate: (objects) ->
    for uuid, content of objects
      instance = @map[uuid]
      unless instance
        # クラス生成
        classObject = @subclasses[content.__classname__]
        throw "No class named `#{content.__classname__}'" unless classObject
        instance = new classObject(content)
        instance.__uuid__ = uuid
        @map[uuid] = instance
      for key, value of content
        # メンバの更新(ここでは敢えてXrefを変換しない)
        continue if key.startsWith("__")
        instance[key] = value

    # 受信した全てのオブジェクトを作りおえたので、Xrefを変換する
    for uuid of objects
      PC._SIDE_.Syncable.convertXref(@map[uuid])

  ###*
  メソッドのリモート呼び出しを行う(@rpcCallへ転送)
  ###
  rpcCall: (callback) ->
    callee = arguments.caller.callee
    PC._SIDE_.Syncable.rpcCall(
      this,
      callee.name,
      callee.arguments[0],
      callee.arguments[1..-1],
      callback
    )

  ###*
  メソッドのリモート呼び出しを行う
  ###
  @rpcCall: (instance, func, context, args) ->
    @nextRpcTag or= 1
    tag = @nextRpcTag
    @nextRpcTag += 1

    #  for data, i in dataArray
    #    dataArray[i] = data.uuid if data instanceof PC._SIDE_.Syncable
    @rpcRequests or= {}
    @rpcRequests[tag] = context.callback
    req = {uuid: instance.uuid, func: func, args: args, tag: tag}
    console.log(req)
    @socket.emit("rpc.call", req)
#endif

#ifdef _SERVER_
  ###*
  ###
  buildSyncProperties: ->
    r = {}
    r[name] = this[name] for name in @syncTarget
    r["xxx_test"] = this
    return r
#endif
