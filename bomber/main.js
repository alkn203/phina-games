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
      "defeat": { 
        "frames": [4,5], 
        "frequency": 8,
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
      // 中心
      "center": {
        "frames": [0,1,2],
        "frequency": 4,
      },
      // 途中
      "middle": {
        "frames": [3,4,5],
        "frequency": 4,
      },
      // 端
      "edge": {
        "frames": [6,7,8],
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
var GRID_SIZE = 64;
var GRID_HALF = GRID_SIZE / 2;
// キー方向配列
var KEY_ARR = [['left', -1, 0], ['right', 1, 0], ['up', 0, -1], ['down', 0, 1]];
// 爆風方向配列
var EXPLODE_ARR = [[-1, 0], [1, 0], [0, -1], [0, 1]];
// ステージデータ
var STAGE_DATA = [
  // ステージ1
  // 0:空白 1:壁 2:ブロック 9:プレイヤー
  ['1111111111',
   '1902002001',
   '1010110101',
   '1202002021',
   '1010110101',
   '1002002001',
   '1010110101',
   '1202002021',
   '1010110101',
   '1002002001',
   '1010110101',
   '1202002021',
   '1010110101',
   '1002002001',
   '1111111111'],
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
    // グリッド
    this.gx = Grid(640, 10);
    this.gy = Grid(960, 15);
    // 背景色
    this.backgroundColor = '#2e8b57';
    // オブジェクトグループ
    this.staticGroup = DisplayElement().addChildTo(this);
    // 爆弾グループ    
    this.bombGroup = DisplayElement().addChildTo(this);
    // 爆発グループ
    this.explosionGroup = DisplayElement().addChildTo(this);
    // ステージセット
    this.setStage(0);
  },
  // マップ作成
  setStage: function(n) {
    var self = this;
    // マップデータをループ
    STAGE_DATA[n].each(function(arr, j) {
      // 文字列を配列に変換
      arr.toArray().each(function(id, i) {
        var x = self.gx.span(i) + GRID_HALF;
        var y = self.gy.span(j) + GRID_HALF;
        // 数値に変換
        id = parseInt(id);
        // 壁
        if (id === 1) {
          var elem = Sprite('tile', GRID_SIZE, GRID_SIZE);
          elem.addChildTo(self.staticGroup).setPosition(x, y);
          // フレームインデックス指定
          elem.frameIndex = id - 1;
          // id設定
          elem.id = id;
          return;
        }
        // ブロック
        if (id === 2) {
          var block = Block().addChildTo(self.staticGroup).setPosition(x, y);
          block.id = id;
          return;
        }
        // プレイヤー作成・配置
        if (id === 9) {
          self.player = Player().addChildTo(self).setPosition(x, y);
        }
      });
    });
  },
  // オブジェクト配置用メソッド
  locateObject: function(obj, i, j) {
    var x = i * GRID_SIZE + GRID_HALF;
    var y = j * GRID_SIZE + GRID_HALF;
    obj.setPosition(x, y);
  },
  // 毎フレーム処理  
  update: function(app) {
    //
    if (this.player.defeated) return;    

    this.checkMove(app);
    this.setBomb(app);
    //
    if (this.hitTestPlayerExplosion()) {
      this.player.flare('defeat');  
    }
  },
  // 移動チェック
  checkMove: function(app) {
    var player = this.player;
    var self = this;
      
    var key = app.keyboard;
    // 移動判定
    KEY_ARR.each(function(elem) {
      var e0 = elem[0];
      var e1 = elem[1];
      var e2 = elem[2];
      var dx = e1 * player.speed;
      var dy = e2 * player.speed;
      // キーが離れたらアニメーションストップ
      if (key.getKeyUp(e0)) {
        player.anim.gotoAndStop(player.anim.currentAnimationName);
        return;
      }
      // キー入力チェック
      if (key.getKey(e0)) {
        // アニメーション変更
        player.anim.gotoAndPlay(e0);
        // キー同時入力対策
        var x = key.getKeyDirection().x;
        var y = key.getKeyDirection().y;
        if (Math.abs(x * y) !== 0) return;
        // 爆弾との当たり判定
        var bomb = self.getBomb(player.x + e1 * GRID_SIZE, player.y + e2 * GRID_SIZE);
        if (bomb) return;
        // 次の移動先矩形
        var rx = player.left + dx;
        var ry = player.top + dy;
        var rect = Rect(rx, ry, player.width, player.height);
        // オブジェクトとの当たり判定
        if (self.hitTestRectStatic(rect)) return;
        // プレイヤー移動
        player.moveBy(dx, dy);
      }
    });
  },
  // プレイヤーとオブジェクトとの当たり判定
  hitTestRectStatic: function(rect) {
    var result = false;
    var player = this.player;
    
    this.staticGroup.children.some(function(obj) {
      // 当たり判定がある場合
      if (Collision.testRectRect(rect, obj)) {
        // 位置を補正してコーナーで移動しやすくする
        // 左右から上下
        if (obj.y < player.y || obj.y > player.y) {
          if (player.x < obj.left) player.x = obj.x - GRID_SIZE;
          if (player.x > obj.right) player.x = obj.x + GRID_SIZE;
        }
        // 上下から左右
        if (obj.x < player.x || obj.x > player.x) {
          if (player.y < obj.top) player.y = obj.y - GRID_SIZE;
          if (player.y > obj.bottom) player.y = obj.y + GRID_SIZE;
        }
        result = true;
        return true;
      }
    });
    return result;
  },
  // プレイヤーと爆発との当たり判定
  hitTestPlayerExplosion: function() {
    var player = this.player;
    var result = false;
    
    this.explosionGroup.children.some(function(explosion) {
      // 当たり判定がある場合
      if (player.hitTestElement(explosion)) {
        result = true;
        return true;
      }
    });
    return result;
  },
  // 爆弾設置
  setBomb: function(app) {
    var player = this.player;
    var key = app.keyboard;
    var self = this;
    //
    if (key.getKeyUp('Z')) {
      var bomb = Bomb().addChildTo(this.bombGroup);
      // 配置がズレないようにインデックス値に変換
      var i = (player.x / GRID_SIZE) | 0;
      var j = (player.y / GRID_SIZE) | 0;
      this.locateObject(bomb, i, j);
      // explodeイベント登録
      bomb.on('explode', function() {
        var x = bomb.x;
        var y = bomb.y;
        var power = bomb.power;
        bomb.remove();
        //
        var exolodeCount = 1;
        // 爆発の回転方向
        var rot = 0;
        // 中心の爆発
        var explosion = Explosion('center', rot);
        explosion.addChildTo(self.explosionGroup).setPosition(x, y);
        // 四方向ループ
        EXPLODE_ARR.each(function(elem) {
          var dirX = elem[0];
          var dirY = elem[1];
          // １ブロック先の位置
          var dx = x + dirX * GRID_SIZE;
          var dy = y + dirY * GRID_SIZE;
          // 爆発のグラフィック回転方向セット
          if (dirX === 1) rot = 90;
          if (dirX === -1) rot = 270;
          if (dirY === 1) rot = 180;
          if (dirY === -1) rot = 0
          // 爆発処理
          self.explode(dirX, dirY, dx, dy, rot, power, exolodeCount);  
        });
      });
    }
  },
  // 爆発処理
  explode: function(dirX, dirY, x, y, rot, power, exolodeCount) {
    // 指定した位置にあるオブジェクトを得る
    var obj = this.getObject(x, y);
    // 壁
    if (obj && obj.id === 1) return;
    // ブロック
    if (obj && obj.id === 2) {
      // 破壊エフェクト
      obj.disable();
      return;
    }
    // 指定した位置にある爆弾を得る
    var bomb = this.getBomb(x, y);
    // 爆弾があれば誘爆
    if (bomb) {
      bomb.flare('explode');
      return;
    }
    // 何もなし      
    if (!obj) {
      // 爆発の端
      if (power === exolodeCount) {
        var edge = Explosion('edge', rot).addChildTo(this.explosionGroup);
        edge.setPosition(x, y);
        return;
      }
      // カウントアップ
      exolodeCount++;
      // 途中の爆発
      var middle = Explosion('middle', rot).addChildTo(this.explosionGroup);
      middle.setPosition(x, y);
      var dx = x + dirX * GRID_SIZE;
      var dy = y + dirY * GRID_SIZE;
      // 同方向に１マス進めて再帰呼び出し
      this.explode(dirX, dirY, dx, dy, rot, power, exolodeCount);
    }
  },
  // 指定位置にオブジェクトがあれば返す
  getObject: function(x, y) {
    var result = null;
    
    this.staticGroup.children.some(function(obj) {
      if (obj.x === x && obj.y === y) {
        result = obj;
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
    this.superInit('tomapiko', GRID_SIZE, GRID_SIZE);
    // スプライトにフレームアニメーションをアタッチ
    this.anim = FrameAnimation('tomapiko_ss').attachTo(this);
    // アニメーションを指定
    this.anim.gotoAndStop('right');
    // 移動速度
    this.speed = 4;
    //
    this.defeated = false;
    // 敗北イベント
    this.one('defeat', function() {
      this.defeated = true;
      this.anim.gotoAndPlay('defeat');
    }, this);
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
    this.superInit('tile', GRID_SIZE, GRID_SIZE);
    // フレームインデックス指定
    this.frameIndex = 1;
  },
  // 破壊エフェクト
  disable: function() {
    this.frameIndex = 2;
    // フェードアウトして削除
    this.tweener.fadeOut(200)
                .call(function() {
                  this.remove();
                }, this).play();
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
    this.superInit('bombs', GRID_SIZE, GRID_SIZE);
    // フレームアニメーション指定
    this.anim = FrameAnimation('bombs').attachTo(this);
    this.anim.gotoAndPlay('fire');
    // 爆発範囲
    this.power = 1;
    // 3秒後に爆発
    this.tweener.wait(3000)
                .call(function() {
                  this.flare('explode');
                }, this).play();
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
    this.superInit('explosions', GRID_SIZE, GRID_SIZE);
    // フレームアニメーション指定
    this.anim = FrameAnimation('explosions').attachTo(this);
    // アニメーションタイプ
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