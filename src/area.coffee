PC = {} unless PC?
PC.Common = {} unless PC.Common?

class PC.Common.Area extends PC.Common.Placeable
  ###*
  @class PC.Common.Area
  @extends PC.Common.Placeable
  カードを置く領域(Client/Server共通部)

  @constructor
  コンストラクタ
  ###
  constructor: ->

  # vim:et sts=2 sw=2
