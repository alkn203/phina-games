// グローバルに展開
phina.globalize();
// アセット
var ASSETS = {
  // 画像
  image: {
    'tile': 'https://cdn.jsdelivr.net/gh/alkn203/phina-games@master/sokoban/assets/sokoban.png',
    'tomapiko': 'https://cdn.jsdelivr.net/gh/phinajs/phina.js@develop/assets/images/tomapiko_ss.png',
  },
  // スプライトシート
  spritesheet: {
    "tomapiko_ss": {
      // フレーム情報
      "frame": {
        "width": 64, // 1フレームの画像サイズ（横）
        "height": 64, // 1フレームの画像サイズ（縦）
        "cols": 6, // フレーム数（横）
        "rows": 3, // フレーム数（縦）
      },
      // アニメーション情報
      "animations": {
        "left": { // アニメーション名
          "frames": [12,13,14], // フレーム番号範囲
          "next": "left", // 次のアニメーション
          "frequency": 4, // アニメーション間隔
        },
        "right": { 
          "frames": [15,16,17], 
          "next": "right", 
          "frequency": 4, 
        },
        "up": { 
          "frames": [9,10,11], 
          "next": "up", 
          "frequency": 4, 
        },
        "down": { 
          "frames": [6,7,8], 
          "next": "down",
          "frequency": 4,
        },
      }
    },
  }
};
// 定数
var UNIT = 64;
// キー情報配列
var KEY_ARR = [['left', -1, 0],['right', 1, 0],['up', 0, -1],['down', 0, 1]];
// マップデータ
var MAP_DATA = [
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,3,3,3,3,3,0],
  [0,3,3,3,3,1,1,1,3,0],
  [0,3,2,1,1,1,2,1,3,0],
  [0,3,1,3,1,3,1,3,3,0],
  [0,3,1,1,1,1,1,3,0,0],
  [0,3,3,3,3,3,3,3,0,0],
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
];
// マップ当たり判定データ
var MAP_COLLISION = [
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,1,1,1,1,1,0],
  [0,1,1,1,1,0,0,0,1,0],
  [0,1,0,0,0,0,0,0,1,0],
  [0,1,0,1,0,1,0,1,1,0],
  [0,1,0,0,0,0,0,1,0,0],
  [0,1,1,1,1,1,1,1,0,0],
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
];
// 荷物の位置データ
var BAG_LOCATION = [[4, 6], [4, 7]];
/*
 * メインシーン
 */
phina.define("MainScene", {
  // 継承
  superClass: 'DisplayScene',
  // コンストラクタ
  init: function() {
    // 親クラス初期化
    this.superInit();
    // マップクラス
    this.map = phina.util.Map({
      tileWidth: UNIT,
      tileHeight: UNIT,
      imageName: 'tile',
      mapData: MAP_DATA,
      collisionData: MAP_COLLISION,
    }).addChildTo(this);
    // プレイヤー作成・配置
    this.player = Player().addChildTo(this);
    this.locateObject(this.player, 4, 8);
    // 荷物グループ
    this.baggageGroup = DisplayElement().addChildTo(this);
    // 荷物配置
    this.locateBaggage(BAG_LOCATION);
  },
  // 荷物配置
  locateBaggage: function(location) {
    var self = this;
    
    location.each(function(elem) {
      // 荷物作成
      var baggage = Baggage().addChildTo(self.baggageGroup);
      self.locateObject(baggage, elem[0], elem[1]);
    });
  },
  // オブジェクト配置用メソッド
  locateObject: function(obj, i, j) {
    obj.setPosition(i * UNIT + UNIT / 2, j * UNIT + UNIT / 2);
  },
  // 毎フレーム処理  
  update: function(app) {
    this.checkMove(app);
  },
  // 移動チェック
  checkMove: function(app) {
    var player = this.player;
    var map = this.map;
    var self = this;
    // 移動中なら何もしない
    if (player.moving) return;
      
    var key = app.keyboard;
    var array = [['left', -1, 0],['right', 1, 0],['up', 0, -1],['down', 0, 1]];
    // 上下左右移動
    KEY_ARR.each(function(elem) {
      var e0 = elem[0];
      var e1 = elem[1];
      var e2 = elem[2];
      var dx = e1 * UNIT;
      var dy = e2 * UNIT;
      // キー入力チェック
      if (key.getKey(e0)) {
        var px = player.x + dx;
        var py = player.y + dy;
        // 壁との当たり判定
        if (map.hitTest(px, py)) return;
        // 隣に荷物があるかチェック
        var baggage = self.getBaggage(px, py);
        // 荷物がある場合
        if (baggage) {
          var bx = baggage.x + dx;
          var by = baggage.y + dy;
          // １つ先をチェック・壁なら移動不可
          if (map.hitTest(bx, by)) return;
          // 荷物なら移動不可
          if (self.getBaggage(bx, by)) return;
          // 荷物移動
          self.moveBaggage(baggage, bx, by);
          // プレイヤーのアニメーション変更
          player.anim.gotoAndPlay(e0);
          // プレイヤー移動
          self.movePlayer(px, py);
        }
        // 何もない場合
        else {
          player.anim.gotoAndPlay(e0);
          // プレイヤー移動
          self.movePlayer(px, py);
        }
      }
    });
  },
  // プレイヤーの移動処理
  movePlayer: function(destX, destY) {
    var player = this.player;
    player.moving = true;
    
    player.tweener.clear()
                  .to({x: destX, y: destY}, 200)
                  .call(function() {
                    player.moving = false;  
                  }).play();
  },
  // 荷物の移動処理
  moveBaggage: function(baggage, destX, destY) {
    var self = this;
    var map = this.map;
    
    baggage.tweener.clear()
                   .to({x: destX, y: destY}, 200)
                   .call(function() {
                     var tile = map.checkTile(baggage.x, baggage.y);
                     baggage.frameIndex = tile === 2 ? 5 : 4;
                   }).play();
  },
  // スポットに荷物があるかチェックする
  checkSpot: function() {
    var map = this.map;
    
    this.baggageGroup.children.each(function(baggage) {
      if (map.checkTile(baggage.x, baggage.y) === 2) {
        baggage.frameIndex = 5;
      }
    });
  },
  // 指定位置に荷物があれば返す
  getBaggage: function(x, y) {
    var result = null;
    
    this.baggageGroup.children.some(function(baggage) {
      if (baggage.x === x && baggage.y === y) {
        result = baggage;
        return true;
      }
    });
    return result;
  },
});
/*
 * プレイヤークラス
 */
phina.define("Player", {
  // 継承
  superClass: 'Sprite',
  // コンストラクタ
  init: function() {
    // 親クラス初期化
    this.superInit('tomapiko', 64, 64);
    this.moving = false;
    // スプライトにフレームアニメーションをアタッチ
    this.anim = FrameAnimation('tomapiko_ss').attachTo(this);
    // アニメーションを指定
    this.anim.gotoAndPlay('right');
  },
});
/*
 * 荷物クラス
 */
phina.define("Baggage", {
  // 継承
  superClass: 'Sprite',
  // コンストラクタ
  init: function() {
    // 親クラス初期化
    this.superInit('tile', 64, 64);
    // フレームインデックス指定
    this.frameIndex = 4;
  },
});
/*
 * メイン処理
 */
phina.main(function() {
  // アプリケーションを生成
  var app = GameApp({
    // MainScene から開始
    //startLabel: 'main',
    // アセット読み込み
    assets: ASSETS,
  });
  // fps表示
  //app.enableStats();
  // 実行
  app.run();
});