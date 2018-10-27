// グローバルに展開
phina.globalize();
// アセット
var ASSETS = {
  // 画像
  image: {
    'bg00': 'https://rawgit.com/alkn203/phina-games/master/radar_touch/assets/bg00.png',
    'bg01': 'https://rawgit.com/alkn203/phina-games/master/radar_touch/assets/bg01.png',
    'bomb': 'https://rawgit.com/alkn203/phina-games/master/radar_touch/assets/bomb.png',
    'cross': 'https://rawgit.com/alkn203/phina-games/master/radar_touch/assets/cross.png',
    'explosion': 'https://rawgit.com/alkn203/phina-games/master/radar_touch/assets/explosion.png',
    'starship': 'https://rawgit.com/alkn203/phina-games/master/radar_touch/assets/starship.png',
  },
  // スプライトシート
  spritesheet: {
    "explosion_ss":
    {
      // フレーム情報
      "frame": {
        "width": 128, // 1フレームの画像サイズ（横）
        "height": 128, // 1フレームの画像サイズ（縦）
        "cols": 10, // フレーム数（横）
        "rows": 1, // フレーム数（縦）
      },
      // アニメーション情報
      "animations" : {
        "keep": { // アニメーション名
          "frames": [1,2,3,4,5,6], // フレーム番号範囲
          "next": "repeat", // 次のアニメーション
          "frequency": 1, // アニメーション間隔
        },
        "repeat": { // アニメーション名
          "frames": [4,5,6], // フレーム番号範囲
          "next": "repeat", // 次のアニメーション
          "frequency": 6, // アニメーション間隔
        },
        "once": { // アニメーション名
          "frames": [0,1,2,3,4,5,6,7,8,9], // フレーム番号範囲
          "frequency": 1, // アニメーション間隔
        },
      }
    },      
  },
};
// 定数
var SCREEN_WIDTH   = 640;
var SCREEN_HEIGHT  = 960;
var FRAME_OFFSET_X = 16; // フレームの横のオフセット値
var FRAME_OFFSET_Y = 150; // フレームの縦のオフセット値
var SQUARE_NUM_X   = 8; // 横のマスの数; 
var SQUARE_SIZE    = (SCREEN_WIDTH - FRAME_OFFSET_X * 2) / SQUARE_NUM_X; // マスのサイズ
var SHIP_LEN_ARR   = [2, 3, 4]; // 宇宙船の長さの配列 
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
    // 背景
    var base = Sprite('bg01').addChildTo(this).setOrigin(0, 0);
    // グループ
    this.shipGroup = DisplayElement().addChildTo(base);
    this.squareGroup = DisplayElement().addChildTo(base);
    this.replicaGroup = DisplayElement().addChildTo(base);
    // フレーム
    var frame = RectangleShape({
      width: SQUARE_SIZE * SQUARE_NUM_X,
      height: SQUARE_SIZE * SQUARE_NUM_X,
      fill: null,
      strokeWidth: 8,
      cornerRadius: 4,
    }).addChildTo(base);
    
    frame.x = this.gridX.center();
    frame.y = this.gridY.center(-0.5);
    // マス初期化
    this.initSquares();
    // 宇宙船初期化
    this.initShips();
    // レプリカ船配置
    this.initReplicas();
    // 宇宙船を隠す
    this.hideShips();
    //
    this.base = base;
  },
  // マスを配置する
  initSquares: function() {
    var self = this;
    var offsetX = SQUARE_SIZE / 2 + FRAME_OFFSET_X;
    var offsetY = SQUARE_SIZE / 2 + FRAME_OFFSET_Y;
    
    (SQUARE_NUM_X).times(function(i) {
      (SQUARE_NUM_X).times(function(j) {
        var square = Square().addChildTo(self.squareGroup);
        square.x = i * SQUARE_SIZE + offsetX;
        square.y = j * SQUARE_SIZE + offsetY;
        // タッチされた時
        square.onpointend = function() {
          // 宇宙船があるか判定
          self.hitTestShip(square);
        };
      });
    });
  },
  // 宇宙船を再配置する
  initShips: function() {
    var self = this;
    var randNums = [];

    this.shipGroup.children.clear();
    var len = this.squareGroup.children.length;
    // マスの数のインデックス内でランダムな数字
    SHIP_LEN_ARR.length.times(function(i) {
      randNums.push(Random.randint(0, len - 1));  
    });
    // ランダムな位置ｔと回転で宇宙船を配置
    SHIP_LEN_ARR.each(function(len, i) {
      var pos = self.squareGroup.children[randNums[i]].position;
      // 座標の向きと画像の向き
      var rand = [[0, -1, 0], [1, 0, 90], [0, 1, 180], [-1, 0, 270]].random();
      var param = {length: len, x: pos.x, y: pos.y, rotation: rand};
      SpaceShip(param).addChildTo(self.shipGroup);
    });
    // 位置をチェックして無効な配置ならやり直す
    if (!this.checkShipLocation()) {
      this.initShips();
    }
  },
  // 宇宙船を隠す
  hideShips: function() {
    this.shipGroup.children.each(function(ship) {
      ship.partGroup.children.each(function(part) {
        part.hide();  
      });
    });
  },
  // レプリカ船を配置する
  initReplicas: function() {
    var y = this.gridY.span(14.3);
    var rot = [1, 0, 90];
    var sc = 0.8;
    //
    var param2 = {length: 2, x: this.gridX.span(1.5), y: y, rotation: rot, scale: sc};
    var param3 = {length: 3, x: this.gridX.span(5), y: y, rotation: rot, scale: sc};
    var param4 = {length: 4, x: this.gridX.span(10), y: y, rotation: rot, scale: sc};
    //
    SpaceShip(param2).addChildTo(this.replicaGroup);
    SpaceShip(param3).addChildTo(this.replicaGroup);
    SpaceShip(param4).addChildTo(this.replicaGroup);
  },
  // 宇宙船の配置をチェック
  checkShipLocation: function() {
    var locations = [];
    // 船の位置を配列に追加
    this.shipGroup.children.each(function(ship) {
      ship.partGroup.children.each(function(part) {
        locations.push({x: part.x, y: part.y});
      });
    });
    // 左上と右下のマス
    var first = this.squareGroup.children.first;
    var last = this.squareGroup.children.last;
    // マスからのはみ出しチェック
    for(var i = 0; i < locations.length; ++i) {
      var loc = locations[i];
      if (loc.x < first.x || loc.y < first.y || last.x < loc.x || last.y < loc.y) {
          return false;
      }
    }
    // 船同士の重なりチェック
    var count = 0;
    locations.each(function(loc) {
      locations.each(function(loc1) {
        if (loc.x === loc1.x && loc.y === loc1.y) {
          count++;
        }
      });
    });
    console.log(count);
    // 自己重複以外もあるなら無効
    if (count > locations.length) return false;
    return true;
  },
  // 宇宙船との当たりチェック
  hitTestShip: function(square) {
    var result = false;
    var self = this;
    //
    this.shipGroup.children.each(function(ship) {
      ship.partGroup.children.each(function(part) {
        // ヒットなら爆発表示
        if (square.x === part.x && square.y === part.y) {
          part.remove();
          Explosion({anim: 'keep'}).addChildTo(square);
          result = true;
        }
      });
    });
    // はずれの場合×印表示
    if (!result) {
      Cross().addChildTo(square);
      return;
    }
    // 画面をシェイクする
    var shakeW = SQUARE_SIZE / 8;
    this.base.tweener.clear().by({x: -shakeW}, 100).by({x: shakeW}, 50)
                             .by({x: shakeW}, 50).by({x: -shakeW}, 100)
                             .call(function() {
                               self.checkShipDestroy();
                             });
  },
  // 船の破壊チェック
  checkShipDestroy: function() {
    var self = this;
    
    this.shipGroup.children.each(function(ship) {
      // 破壊されている場合
      if (ship.partGroup.children.length === 0) {
        // レプリカ船破壊
        self.destroyReplica(ship.len);
        ship.remove();
      }
    });
    // 全破壊チェック
    if (this.shipGroup.children.length === 0) {
      // ステージクリア
      console.log('clear');
    }
  },
  // レプリカ船破壊処理
  destroyReplica: function(len) {
    var self = this;
    // レプリカ船ループ
    this.replicaGroup.children.each(function(ship) {
      // 船の長さが一致したら
      if (ship.len === len) {
        ship.partGroup.children.each(function(part) {
          // 一回限りの爆発
          Explosion({scale: 0.8}).addChildTo(self).setPosition(part.x, part.y);
        });
        // 船消去
        ship.remove();
      }
    });
  },
});
/*
 * 宇宙船クラス
 */
phina.define("SpaceShip", {
  // 継承
  superClass: 'DisplayElement',
  // コンストラクタ
  init: function(param) {
    var len = param.length;
    var x = param.x;
    var y = param.y;
    var r = param.rotation;
    var scale = param.scale || 1.0;
    var size = SQUARE_SIZE * scale;
    // 親クラス初期化
    this.superInit();
    // シップの長さ
    this.len = len;
    // パーツグループ
    this.partGroup = DisplayElement().addChildTo(this);
    var self = this;
    // シップ組み立て
    (len).times(function(i) {
      var part = Sprite('starship', 128, 128).addChildTo(self.partGroup);
      // 船の向き
      part.setPosition(x + i * r[0] * size, y + i * r[1] * size);
      // 船尾
      if (i === 0) part.frameIndex = 0;
      //途中
      if (i > 0 && i < len - 1) part.frameIndex = 1;
      // 船首
      if (i === len - 1) part.frameIndex = 2;
      // サイズ調整・画像回転
      part.setSize(size, size).setRotation(r[2]);
    });
  },
});
/*
 * マスクラス
 */
phina.define("Square", {
  // 継承
  superClass: 'RectangleShape',
  // コンストラクタ
  init: function() {
    // 親クラス初期化
    this.superInit({
      width: SQUARE_SIZE,
      height: SQUARE_SIZE,
      fill: null,
      strokeWidth: 2,
    });
    // タッチを有効に
    this.setInteractive(true);
  },
});
/*
 * X印クラス
 */
phina.define("Cross", {
  // 継承
  superClass: 'Sprite',
  // コンストラクタ
  init: function() {
    // 親クラス初期化
    this.superInit('cross');
    this.setSize(SQUARE_SIZE, SQUARE_SIZE);
    // 伸縮アニメーション
    this.tweener.scaleTo(0.6, 100).scaleTo(1.0, 100).play();
  },
});
/*
 * 爆発クラス
 */
phina.define("Explosion", {
  // 継承
  superClass: 'Sprite',
  // コンストラクタ
  init: function(param) {
    var anim = param.anim || 'once';
    var scale = param.scale || 1.0;
    var size = SQUARE_SIZE * scale;
    // 親クラス初期化
    this.superInit('explosion', 128, 128);
    this.anim = FrameAnimation('explosion_ss').attachTo(this);
    // フレームアニメーションのサイズにフィットさせない
    this.anim.fit = false;
    this.anim.gotoAndPlay(anim);
    this.setSize(size, size);
  },
  // 毎フレーム処理
  update: function() {
    // アニメーションが終わったら自身を消去
    if (this.anim.finished) this.remove();
  },
});
/*
 * メイン処理
 */
phina.main(function() {
  // アプリケーションを生成
  var app = GameApp({
    // MainScene から開始
    startLabel: 'main',
    // アセット読み込み
    assets: ASSETS,
  });
  // fps表示
  //app.enableStats();
  // 実行
  app.run();
});