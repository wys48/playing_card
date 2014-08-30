/**
 * @file index.js
 * @brief 本システムのメインページ
 */

var LOCALSTORAGE_NICKNAME = "playing_card.nickname";

enchant();
// enchant.widget._env.DBLLIMIT = 200;
// enchant.widget._env.HOLDTIME = 1;
var game;
var logindex = 0;

function console_log(text) {
  console.log(text);
  $("#console").html(logindex + ": " + text + "<br/>" + $("#console").html());
  logindex += 1;
}

/**
 * @fn document.onload
 */
$(function () {


    /**
     * new Core(width, height)
     *
     * Make instance of enchant.Core class. Set window size to 320 x 320
     * Core オブジェクトを作成する。
     * 画面の大きさは 320ピクセル x 320ピクセル に設定する。
     */
    // var game = new Core(320, 320);
    game = new PlayingCardGame();

    /**
     * Core.fps
     *
     * Set fps (frame per second) in this game to 15.
     * ゲームの fps (frame per second) を指定する。この場合、1秒間あたり15回画面が更新される。
     */
    game.fps = 15;
    /**
     * Core#preload
     *
     * You can preload all assets files before starting the game.
     * Set needed file lists in relative/absolute path for attributes of Core#preload
     * 必要なファイルを相対パスで引数に指定する。 ファイルはすべて、ゲームが始まる前にロードされる。
     */
    game.preload("chara1.png");
    game.preload("images/cards_trump.png");

    /**
     * Core#onload
     *
     * ロードが完了した直後に実行される関数を指定している。
     * onload プロパティは load イベントのリスナとして働くので、以下の2つの書き方は同じ意味。
     *
     * game.onload = function(){
     *     // code
     * }
     *
     * game.addEventListener("load", function(){
     *     // code
     * })
     */
    game.onload = function(){
        /**
         * new Sprite(width, height)
         * スプライトオブジェクトを作成する。
         * Sprite は、Entity, Node, EventTarget を継承しており、それぞれのメソッドやプロパティを使うことができる。
         */
        bear = new Sprite(32, 32);

        /**
         * Sprite.image {Object}
         * Core#preload で指定されたファイルは、Core.assets のプロパティとして格納される。
         * Sprite.image にこれを代入することで、画像を表示することができる
         */
        bear.image = game.assets["chara1.png"];

        game.downloadCardAssets();
        var card = new CardSprite(26);
        var g = enchant.Group();
        g.x = 200;
        card.x = 0;
        card.y = 0;
        // game.rootScene.addChild(card);
        g.addChild(card);
        card = new CardSprite(27);
        card.x = 110;
        card.y = 110;
        // game.rootScene.addChild(card);
        g.addChild(card);
        g.ontap = function() {
          console_log("group-ontap");
        };
        game.rootScene.addChild(g);

        /**
         * Node.x Node.y {Number}
         * x, y 座標を指定する。
         * viewport の大きさに合わせて画面が拡大縮小されている場合も、
         * オリジナルの座標系で指定できる。
         */
        bear.x = 0;
        bear.y = 0;

        /**
         * Sprite.frame {Number}
         * (width, height) ピクセルの格子で指定された画像を区切り、
         * 左上から数えて frame 番目の画像を表示することができる。
         * デフォルトでは、0:左上の画像が表示される。
         * このサンプルでは、シロクマが立っている画像を表示する (chara1.gif 参照)。
         */
        bear.frame = 5;
        /**
         * Group#addChild(node) {Function}
         * オブジェクトをノードツリーに追加するメソッド。
         * ここでは、クマの画像を表示するスプライトオブジェクトを、rootScene に追加している。
         * Core.rootScene は Group を継承した Scene クラスのインスタンスで、描画ツリーのルートになる特別な Scene オブジェクト。
         * この rootScene に描画したいオブジェクトを子として追加する (addChild) ことで、毎フレーム描画されるようになる。
         * 引数には enchant.Node を継承したクラス (Entity, Group, Scene, Label, Sprite..) を指定する。
         */
        game.rootScene.addChild(bear);

        /**
         * EventTarget#addEventListener(event, listener)
         * イベントに対するリスナを登録する。
         * リスナとして登録された関数は、指定されたイベントの発行時に実行される。
         * よく使うイベントには、以下のようなものがある。
         * - "touchstart" : タッチ/クリックされたとき
         * - "touchmove" : タッチ座標が動いた/ドラッグされたとき
         * - "touchend" : タッチ/クリックが離されたとき
         * - "enterframe" : 新しいフレームが描画される前
         * - "exitframe" : 新しいフレームが描画された後
         * enchant.js やプラグインに組み込まれたイベントは、それぞれのタイミングで自動で発行されるが、
         * EventTarget#dispatchEvent で任意のイベントを発行することもできる。
         *
         * ここでは、右に向かって走っていくアニメーションを表現するために、
         * 新しいフレームが描画される前に、毎回クマの画像を切り替え、x座標を1増やすという処理をリスナとして追加する。
         */
        bear.addEventListener("enterframe", function(){
            /**
             * クマを走らせるために、x座標をインクリメントしている。
             * この無名関数 function(){ ... } は enterframe イベントのリスナなので、毎フレーム実行される。
             */
            this.x += 1;

            /**
             * this.age (Node.age) は、クマのオブジェクトが今までに何回描画されたか
             * クマの画像を変えて走るアニメーションを表現するために、
             * frame を 6 -> 7 -> 6 -> 7.. と順番に変えている。
             */
            this.frame = this.age % 2 + 6;
        });

        /**
         * タッチされると消える処理を実現するために、
         * touchstart イベントが起こったとき、クマが消える処理をリスナとして追加する。
         */
        // bear.addEventListener("touchstart", function(){
        bear.addEventListener("touchmove", function(){
            /**
             * クマを game.rootScene から削除する。
             * Group#addChild の逆は Group#removeChild。
             */
            game.rootScene.removeChild(bear);
        });
    };

    /**
     * Core#start
     * ゲームを開始する。この関数を実行するまで、ゲームは待機状態となる。
     * 代わりに Core#debug を使うことで、デバッグモードで起動することができる。
     * Core#pause(); で一時停止し、 Core#resume(); で再開することができる。
     */
    game.start();


  var socket = io.connect();

  if(window.localStorage) {
    // localStorageに保存されたニックネームを復元
    var name = window.localStorage.getItem(LOCALSTORAGE_NICKNAME);
    if(name != null) {
      $("#nickname").val(name);
    }
  }

  /**
   * @fn socket.on.connect
   * @brief サーバとの接続完了
   */
  socket.on('connect', function () {
    socket.emit('enter_index'); //!< indexページへ入ったことを通知
  });

  /**
   * @fn socket.on.create_user_id
   * @brief サーバから自分自身のユーザIDを受信
   * @param user_id   [in] ユーザID
   * @note ユーザIDはサーバが生成する
   */
  socket.on('create_user_id', function (user_id) {
    $('#user_id').val(user_id);
    $('#enter').attr('disabled', false);
  });

  /**
   * @fn socket.on.update_room
   * @brief ルーム一覧の更新
   * @param roomlist  [in] ルーム情報 {room_id:, room_name:} の配列
   */
  socket.on('update_room', function (roomlist) {
    var obj = $('#room_id');
    obj.children().remove();
    obj.append($('<option>').val('').text('(新規ルーム)'));
    for (var i = 0; i < roomlist.length; ++i) {
      obj.append($('<option>').val(roomlist[i].room_id).text(roomlist[i].room_name));
    }
    obj.change();
    $('#enter').show();
  });

  /**
   * @fn socket.on.add_message
   * @brief メッセージエリアのテキスト受信
   * @param post    [in] メッセージデータ {name:, message:, clear:}
   */
  socket.on('add_message', function (post) {
    if(post.clear === true) {
      $('#messages').children().remove();
    }
    var li = $('<li>').text(post.name + ': ' + post.message + ' (' + (new Date()).toLocaleString() + ')');
    $('#messages').prepend(li);
  });

  /**
   * @fn #enter.click
   * @brief 作成参加ボタンのクリックイベント処理
   */
  $("#enter").click(function() {
    if(window.localStorage) {
      // localStorageにニックネームを保存
      window.localStorage.setItem(LOCALSTORAGE_NICKNAME, $("#nickname").val());
    }
    $("#enter").attr("disabled", true);
    $("#form").submit();
  });

  /**
   * @fn #room_id.change
   * @brief ルーム選択の変更イベント処理
   */
  $("#room_id").change(function() {
    if($(this).val() === "") {
      $("#enter").val("作成");
    } else {
      $("#enter").val("参加");
    }
  });

});

// vim: et sts=2 sw=2:
