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
  setSyncDestination: (socket) ->
    @syncDestination = socket
#endif

#ifdef _SERVER_
  ###*
  ###
  sync: (socket) ->
    # TODO:通知して良いかの判定
    @syncDestination.emit("sync", {className: @className, uuid: @uuid, properties: @buildSyncProperties()})
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
    socket.on("request", (data) =>
      console.log("Info: on request #{data.event} for #{data.uuid}")
      instance = @map[data.uuid]
      unless instance
        console.log("Error: unknown uuid: #{data.uuid}")
        return
      func = instance[data.event]
      unless func
        console.log("Error: no event function named `#{data.event}'")
        return
      res = {id: data.id, data: null}
      context =
        requester: socket.id  # FIXME
        callback: (result) -> res.data = result
      PC._SIDE_.Syncable.convertXref(data.data)
      func.apply(instance, [context].concat(data.data))
      console.log("Info: response #{res}")
      socket.emit("response", res)
    )
#endif
#ifdef _CLIENT_
    @socket = socket
    @requests = {}
    @req_id = 0
    @socket.on("sync", (data) =>
      instance = @map[data.uuid]
      PC._SIDE_.Syncable.convertXref(data.properties)
      if instance
        #  instance[key] = value for key, value of data.properties
        instance.onSync(data.properties)
      else
        klass = @subclasses[data.className]
        console.log("sycable_is_creating_a_new_class": data.properties)
        instance = new klass(data.properties)
        instance.uuid = data.uuid
        @map[data.uuid] = instance
    )
    @socket.on("response", (data) =>
      console.log(data)
      req_id = data.id
      callback = @requests[req_id]
      delete @requests[req_id]
      console.log("no callback! (#{req_id})") unless callback
      callback(data.data) if callback
    )
#endif

#ifdef _CLIENT_
  ###*
  メソッドのリモート呼び出しを行う(@requestServerへの転送のみ)
  ###
  requestServer: (event, context, data...) ->
    PC._SIDE_.Syncable.requestServer(this, event, context, data)

  ###*
  メソッドのリモート呼び出しを行う
  ###
  @requestServer: (instance, event, context, dataArray) ->
    @req_id += 1
    for data, i in dataArray
      dataArray[i] = data.uuid if data instanceof PC._SIDE_.Syncable
    @requests[@req_id] = context.callback or (-> null)
    req = {id: @req_id, uuid: instance.uuid, event: event, data: dataArray}
    console.log(req)
    @socket.emit("request", req)
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
