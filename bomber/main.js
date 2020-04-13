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
      "center": {
        "frames": [0,1,2],
        "frequency": 2,
      },
      "middle": {
        "frames": [3,4,5],
        "frequency": 2,
      },
      "edge": {
        "frames": [6,7,8],
        "frequency": 2,
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
//  爆風方向配列
var EXPLODE_ARR = [[-1, 0, 90], [1, 0, 90], [0, -1, 0], [0, 1, 0]];
// ステージデータ
var STAGE_DATA = [
  {
    // ステージ1
    // マップデータ
    map: [
      [1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,0,0,0,1],
      [1,0,1,0,1,1,0,1,0,1],
      [1,0,0,0,0,0,0,0,0,1],
      [1,0,1,0,1,1,0,1,0,1],
      [1,0,0,0,0,0,0,0,0,1],
      [1,0,1,0,1,1,0,1,0,1],
      [1,0,0,0,0,0,0,0,0,1],
      [1,0,1,0,1,1,0,1,0,1],
      [1,0,0,0,0,0,0,0,0,1],
      [1,0,1,0,1,1,0,1,0,1],
      [1,0,0,0,0,0,0,0,0,1],
      [1,0,1,0,1,1,0,1,0,1],
      [1,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1]],
    // ブロックの位置データ
    block: [
      [3,1],[6,1],
      [1,3],[3,3],[6,3],[8,3],
      [3,5],[6,5],
      [1,7],[3,7],[6,7],[8,7],
      [3,9],[6,9],
      [1,11],[3,11],[6,11],[8,11],
      [3,13],[6,13],
    ],
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
      collisionData: data[n].map,
    }).addChildTo(this);
    // プレイヤー作成・配置
    this.player = Player().addChildTo(this);
    this.locateObject(this.player, data[n].player.i, data[n].player.j);
    // ブロックグループ作成・配置
    this.blockGroup = DisplayElement().addChildTo(this);
    this.locateBlock(data[n].block);
    // 爆弾グループ    
    this.bombGroup = DisplayElement().addChildTo(this);
    // 爆発グループ
    this.explosionGroup = DisplayElement().addChildTo(this);
  },
  // ブロック配置
  locateBlock: function(location) {
    var self = this;
    
    location.each(function(elem) {
      // ブロック作成
      var block = Block().addChildTo(self.blockGroup);
      self.locateObject(block, elem[0], elem[1]);
    });
  },
  //
  explode: function(dirX, dirY, x, y, rot) {
    var map = this.map;
    // 壁
    if (map.checkTile(x, y) === 1) return;
    // ブロック
    var block = this.getBlock(x, y);
    if (block) {
      block.disable();
      return;
    }
    // 爆弾
    var bomb = this.getBomb(x, y);
    if (bomb) {
      bomb.flare('explode');
      return;
    }
    // 何もなし      
    if (map.checkTile(x, y) === 0) {
      var explosion = Explosion('middle', rot).addChildTo(this.explosionGroup);
      explosion.setPosition(x, y);
      var dx = x + dirX * UNIT;
      var dy = y + dirY * UNIT;
      this.explode(dirX, dirY, dx, dy, rot);
    }
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
    this.setBomb(app);
  },
  // 移動チェック
  checkMove: function(app) {
    var player = this.player;
    var map = this.map;
    var self = this;
    // 移動中なら何もしない
    if (player.moving) return;
      
    var key = app.keyboard;
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
        if (map.hitTest(px, py)) return;
        // ブロックとの当たり判定
        if (self.getBlock(px, py)) return;
        // 爆弾との当たり判定
        if (self.getBomb(px, py)) return;
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
  // 爆弾設置
  setBomb: function(app) {
    var player = this.player;
    // 移動中なら何もしない
    if (player.moving) return;
      
    var key = app.keyboard;
    var self = this;
    //
    if (key.getKeyUp('Z')) {
      var bomb = Bomb().addChildTo(this.bombGroup);
      bomb.setPosition(player.x, player.y);
      // explodeイベント
      bomb.on('explode', function() {
        var x = bomb.x;
        var y = bomb.y;
        bomb.remove();
        // 爆発の中心
        var explosion = Explosion('center', 0).addChildTo(self.explosionGroup);
        explosion.setPosition(x, y);
        // 四方爆風処理
        EXPLODE_ARR.each(function(elem) {
          var dirX = elem[0];
          var dirY = elem[1];
          var rot = elem[2];
          var dx = x + dirX * UNIT;
          var dy = y + dirY * UNIT;
          //
          self.explode(dirX, dirY, dx, dy, rot);  
        });
      });
    }
  },
  // 指定位置にブロックがあれば返す
  getBlock: function(x, y) {
    var result = null;
    
    this.blockGroup.children.some(function(block) {
      if (block.x === x && block.y === y) {
        result = block;
        return true;
      }
    });
    return result;
  },
  // 指定位置に爆弾があれば返す
  getBomb: function(x, y) {
    var result = null;
    
    this.bombGroup.children.some(function(bomb) {
      if (bomb.x === x && bomb.y === y) {
        result = bomb;
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
    // 威力
    this.power = 1;
    //
    this.tweener.wait(3000)
                .call(function() {
                  this.flare('explode');
                }, this);
  },
});
/*
 * 爆発クラス
 */
phina.define("Explosion", {
  // 継承
  superClass: 'Sprite',
  // コンストラクタ
  init: function(type, angle) {
    // 親クラス初期化
    this.superInit('explosions', UNIT, UNIT);
    // フレームアニメーション指定
    this.anim = FrameAnimation('explosions').attachTo(this);
    // タイプ
    this.anim.gotoAndPlay(type);
    // 角度
    this.rotation = angle;
  },
  // 毎フレーム更新
  update: function() {
    // フレームアニメーションが終わったら削除
    if (this.anim.finished) {
      this.remove();
    }
  },
});
/*
 * ブロッククラス
 */
phina.define("Block", {
  // 継承
  superClass: 'Sprite',
  // コンストラクタ
  init: function() {
    // 親クラス初期化
    this.superInit('tile', UNIT, UNIT);
    //
    this.frameIndex = 2;
  },
  // 破壊
  disable: function() {
    //
    this.frameIndex = 3;
    //
    var self = this;
    this.tweener.fadeOut(200)
                .call(function() {
                  self.remove();
                }).play();
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