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
          "next": "right", // 次のアニメーション
          "frequency": 4, // アニメーション間隔
        },
        "up": { 
          "frames": [9,10,11], 
          "next": "up", // 次のアニメーション
          "frequency": 4, // アニメーション間隔
        },
        "down": { 
          "frames": [6,7,8], 
          "next": "down", // 次のアニメーション
          "frequency": 4, // アニメーション間隔
        },
      }
    },
  }
};
// 定数
var UNIT = 64;
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
    // マップデータ
    var data = [
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
    // マップ当たり判定
    var collision = [
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
    // 荷物の位置
    var baglocation = [[4, 6], [4, 7]];
    // マップクラス
    this.map = phina.util.Map({
      tileWidth: UNIT,
      tileHeight: UNIT,
      imageName: 'tile',
      mapData: data,
      collisionData: collision,
    }).addChildTo(this);
    // プレイヤー作成
    this.player = Player().addChildTo(this);
    this.player.setPosition(4 * UNIT + UNIT / 2, 8 * UNIT + UNIT / 2);
    // 荷物グループ
    this.baggageGroup = DisplayElement().addChildTo(this);
    this.locateBaggage(baglocation);
  },
  // 荷物配置
  locateBaggage: function(locations) {
    var baggageGroup = this.baggageGroup;
    
    locations.each(function(elem) {
      // 荷物作成
      var baggage = Baggage().addChildTo(baggageGroup);
      var x = elem[0] * UNIT + UNIT / 2;
      var y = elem[1] * UNIT + UNIT / 2;
      baggage.setPosition(x, y);
    });
  },
  // 毎フレーム処理  
  update: function(app) {
    this.movePlayer(app);
  },
  // プレイヤー移動
  movePlayer: function(app) {
    var player = this.player;
    var map = this.map;
    // 移動中なら何もしない
    if (player.moving) return;
      
    var key = app.keyboard;
    var array = [['left',-1,0],['right',1,0],['up',0,-1],['down',0,1]];
    // 上下左右移動
    array.each(function(elem) {
      var e0 = elem[0];
      var e1 = elem[1];
      var e2 = elem[2];
      // キー入力チェック
      if (key.getKey(e0)) {
        // マップとの当たり判定
        if (map.hitTest(player.x + e1 * UNIT, player.y + e2 * UNIT)) {
          return;
        }
        else {
          player.moving = true;
          player.anim.gotoAndPlay(e0);
          // 移動処理
          player.tweener
                .clear()
                .to({x: player.x + e1 * UNIT, y: player.y + e2 * UNIT}, 200)
                .call(function() {
                  player.moving = false;  
                }).play();
        }
      }
    });
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