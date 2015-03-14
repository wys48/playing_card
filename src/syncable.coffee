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
    @uuid = UUID.v4()
    console.log("new:#{@uuid}")
    PC._SIDE_.Syncable.map[@uuid] = this
#endif
#ifdef _CLIENT_
#endif

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

  ###*
  ###
  sync: (socket) ->
    # TODO:通知して良いかの判定
    @syncDestination.emit("sync", {className: @className, uuid: @uuid, properties: @buildSyncProperties()})

#endif
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
      # TODO: replace cross references
      if instance
        #  instance[key] = value for key, value of data.properties
        instance.onSync(data.properties)
      else
        klass = @subclasses[data.className]
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

  requestServer: (event, context, data...) ->
    PC._SIDE_.Syncable.requestServer(this, event, context, data)

  @requestServer: (instance, event, context, dataArray) ->
    @req_id += 1
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
    return r
#endif
