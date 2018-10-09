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
};
// 定数
var SCREEN_WIDTH   = 640;
var SCREEN_HEIGHT  = 960;
var FRAME_OFFSET_X = 16; // フレームの横のオフセット値
var FRAME_OFFSET_Y = 100; // フレームの縦のオフセット値
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
    // グループ
    this.shipGroup = DisplayElement().addChildTo(this);
    this.squareGroup = DisplayElement().addChildTo(this);
    // マス初期化
    this.initSquares();
    //
    this.initShips();
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
      var rand = [[0, -1, 0], [1, 0, 90], [0, 1, 180], [-1, 0, 270]].random();
      SpaceShip(len, pos.x, pos.y, rand).addChildTo(self.shipGroup);
    });
    // 位置をチェックして無効な配置ならやり直す
    if (!this.checkShipLocation()) {
      this.initShips();
    }
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
    // マスからのはみ出していいたら無効
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
 * 宇宙船クラス
 */
phina.define("SpaceShip", {
  // 継承
  superClass: 'DisplayElement',
  // コンストラクタ
  init: function(len, x, y, r) {
    var self = this;
    // 親クラス初期化
    this.superInit();
    // シップの長さ
    this.len = len;
    // パーツグループ
    this.partGroup = DisplayElement().addChildTo(this);
    // シップ組み立て
    (len).times(function(i) {
      var part = Sprite('starship', 128, 128).addChildTo(self.partGroup);
      // 向き
      part.setPosition(x + r[0]*i*SQUARE_SIZE, y + r[1]*i*SQUARE_SIZE);
      // 船尾
      if (i === 0) part.frameIndex = 0;
      //途中
      if (i > 0 && i < len - 1) part.frameIndex = 1;
      // 船首
      if (i === len - 1) part.frameIndex = 2;
      // サイズ調整
      part.setSize(SQUARE_SIZE, SQUARE_SIZE);
      // 画像回転
      part.rotation = r[2];      
    });
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