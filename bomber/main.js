// グローバルに展開
phina.globalize();
// スプライトシート
var SPRITE_SHEET = {
  "tomapiko_ss": {
    // フレーム情報
    "frame": {
      // 1フレームの画像サイズ（横）
      "width": 64,
      // 1フレームの画像サイズ（縦）
      "height": 64,
      // フレーム数（横）
      "cols": 6,
      // フレーム数（縦）
      "rows": 3,
    },
    // アニメーション情報
    "animations": {
      // アニメーション名
      "left": {
        // フレーム番号範囲
        "frames": [12,13,14],
        // 次のアニメーション
        "next": "left",
        // アニメーション間隔
        "frequency": 4,
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
  // 爆弾
  "bombs": {
    "frame": {
      "width": 64,
      "height": 64,
      "cols": 2,
      "rows": 1,
    },
    "animations": {
      "fire": {
        "frames": [0,1],
        "next": "fire",
        "frequency": 4,
      },
    }
  },
  // 爆発
  "explosions": {
    "frame": {
      "width": 64,
      "height": 64,
      "cols": 9,
      "rows": 1,
    },
    "animations": {
      "explode_center": {
        "frames": [0,1,2],
        "next": "explode_center",
        "frequency": 4,
      },
    }
  },
};
// アセット
var ASSETS = {
  // 画像
  image: {
    'tile': 'https://cdn.jsdelivr.net/gh/alkn203/phina-games@master/bomber/assets/tile.png',
    'bombs': 'https://cdn.jsdelivr.net/gh/alkn203/phina-games@master/bomber/assets/bombs.png',
    'explosions': 'https://cdn.jsdelivr.net/gh/alkn203/phina-games@master/bomber/assets/explosions.png',
    'tomapiko': 'https://cdn.jsdelivr.net/gh/phinajs/phina.js@develop/assets/images/tomapiko_ss.png',
  },
  // スプライトシート
  spritesheet: SPRITE_SHEET
};
// 定数
var UNIT = 64;
// キー情報配列
var KEY_ARR = [['left', -1, 0], ['right', 1, 0], ['up', 0, -1], ['down', 0, 1]];
// ステージデータ
var STAGE_DATA = [
  {
    // ステージ1
    // マップデータ
    map: [
      [1,1,1,1,1,1,1,1,1,1],
      [1,0,0,4,2,2,0,0,0,1],
      [1,0,1,2,1,1,2,1,2,1],
      [1,0,2,0,0,0,0,2,0,1],
      [1,2,1,2,1,1,2,1,0,1],
      [1,0,0,0,2,2,0,0,0,1],
      [1,0,1,2,1,1,2,1,2,1],
      [1,0,0,0,2,0,0,0,0,1],
      [1,2,1,2,1,1,2,1,0,1],
      [1,0,0,0,2,0,0,0,0,1],
      [1,0,1,2,1,1,2,1,2,1],
      [1,0,0,0,2,0,0,2,0,1],
      [1,2,1,2,1,1,2,1,0,1],
      [1,0,0,2,2,2,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1]],
    // プレイヤーの位置データ
    player: {i: 1, j: 1},
  },
];
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
    //
    

    this.setStage(0);
  },
  // ステージ作成
  setStage: function(n) {
    var data = STAGE_DATA;
    //
    this.map = phina.util.Map({
      tileWidth: UNIT,
      tileHeight: UNIT,
      imageName: 'tile',
      mapData: data[n].map,
      collisionData: data[n].collision,
    }).addChildTo(this);
    // プレイヤー作成・配置
    this.player = Player().addChildTo(this);
    this.locateObject(this.player, data[n].player.i, data[n].player.j);
    
    this.bombGroup = DisplayElement().addChildTo(this);
    this.explosionGroup = DisplayElement().addChildTo(this);
    var self = this;
    
    var bomb = Bomb().addChildTo(this);
    bomb.on('explode', function() {
      var explosion = CenterExplosion().addChildTo(self.explosionGroup);
      explosion.setPosition(bomb.x, bomb.y);
      bomb.remove();
    });
    this.locateObject(bomb, 2, 1);
  },
  // オブジェクト配置用メソッド
  locateObject: function(obj, i, j) {
    var x = i * UNIT + UNIT / 2;
    var y = j * UNIT + UNIT / 2;
    obj.setPosition(x, y);
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
    // 移動判定
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
        if (map.checkTile(px, py) === 1) return;
        // ブロックとの当たり判定
        if (map.checkTile(px, py) === 2) return;
        // 何もない場合
          player.anim.gotoAndPlay(e0);
          // プレイヤー移動
          self.movePlayer(px, py);
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
    this.superInit('tomapiko', UNIT, UNIT);
    this.moving = false;
    // スプライトにフレームアニメーションをアタッチ
    this.anim = FrameAnimation('tomapiko_ss').attachTo(this);
    // アニメーションを指定
    this.anim.gotoAndPlay('right');
  },
});
/*
 * 爆弾クラス
 */
phina.define("Bomb", {
  // 継承
  superClass: 'Sprite',
  // コンストラクタ
  init: function() {
    // 親クラス初期化
    this.superInit('bombs', UNIT, UNIT);
    // フレームアニメーション指定
    this.anim = FrameAnimation('bombs').attachTo(this);
    this.anim.gotoAndPlay('fire');
    var self = this;
    //
    this.tweener.wait(3000)
                .call(function() {
                  self.flare('explode');
                });
  },
});
/*
 * 爆発クラス（中心）
 */
phina.define("CenterExplosion", {
  // 継承
  superClass: 'Sprite',
  // コンストラクタ
  init: function() {
    // 親クラス初期化
    this.superInit('explosions', UNIT, UNIT);
    // フレームアニメーション指定
    this.anim = FrameAnimation('explosions').attachTo(this);
    this.anim.gotoAndPlay('explode_center');
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
  // 実行
  app.run();
});