// グローバルに展開
phina.globalize();
// 定数
var SCREEN_WIDTH = 16 * 40; 
var SCREEN_HEIGHT = 9 * 40; 
var KEYWORD_SIZE = SCREEN_HEIGHT / 12;
var KEYWORD_SPEED_X = 6;
var KEYWORD_SPEED_Y = -10;
var GRAVITY = 0.2;
var COLORS = ['rgb(249,38,114)', 'rgb(166,226,46)', 'rgb(253,151,31)', 'rgb(102,217,239)'];
var BG_COLOR = 'rgb(39,40,34)';
var KEYWORDS = null;
var INTERVAL = 1000;
var CONTINUE = 3;
// アセット
var ASSETS = {
  // キーワード一覧
  text: {
    'keywords': 'https://cdn.jsdelivr.net/gh/alkn203/phina-games@master/keyword-shot/assets/keywords',
  },
};
/*
 * タイトルシーン
 */
phina.define('TitleScene', {
  // 継承
  superClass: 'DisplayScene',
  // コンストラクタ
  init: function(params) {
    this.superInit({
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
    });
    
    this.backgroundColor = BG_COLOR;
    var fontColor = 'rgb(255,255,255)';
    var buttonSize = 168;

    this.fromJSON({
      children: {
        titleText: {
          className: 'Label',
          arguments: {
            text: 'Keyword Shot',
            fill: 'rgb(166,226,46)',
            stroke: null,
            fontSize: SCREEN_HEIGHT / 6,
          },
          x: this.gridX.center(),
          y: this.gridY.span(5),
        },

        subtitleText: {
          className: 'Label',
          arguments: {
            text: 'Just type the keywords',
            fill: 'rgb(253,151,31)',
            stroke: null,
            fontSize: SCREEN_HEIGHT / 12,
          },
          x: this.gridX.center(),
          y: this.gridY.center(),
        },

        explainText: {
          className: 'Label',
          arguments: {
            text: 'case-insensitive',
            fill: 'rgb(253,151,31)',
            stroke: null,
            fontSize: SCREEN_HEIGHT / 12,
          },
          x: this.gridX.center(),
          y: this.gridY.center(2),
        },

        startText: {
          className: 'Label',
          arguments: {
            text: 'Click to start',
            fill: 'rgb(102,217,239)',
            stroke: null,
            fontSize: SCREEN_HEIGHT / 10,
          },
          x: this.gridX.center(),
          y: this.gridY.center(5),
        },
      }
    });
    // 文字点滅
    this.startText.tweener.fadeOut(1000).fadeIn(1000).setLoop(true).play();
    // キーワードをロード
    this.loadKeywords();
  },
  // タッチ時
  onpointend: function() {
    // 次のシーンへ
    this.exit();
  },
  // キーワードをロード
  loadKeywords: function() {
    var keywords = AssetManager.get('text', 'keywords');
    // 改行で分けて配列として格納
    KEYWORDS = keywords.data.split(/\r\n|\n/);
    // 文字数の小さい順に並べる
    KEYWORDS.sort(function(a, b) { return a.length - b.length; });
  },
});
/*
 * 自作カウントシーン
 */
phina.define('CountScene', {
  // 継承
  superClass: 'DisplayScene',
  // 継承
  init: function(level) {
    this.superInit({
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
    });
    
    this.backgroundColor = 'rgba(128, 128, 128, 0.5)';
    var fontColor = 'rgb(255, 255, 255)';
    this.counter = 3;
    // レベル
    var label = Label({
      text:'LEVEL ' + level,
      fill: fontColor,
      fontSize: SCREEN_HEIGHT / 8,
    }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center(-4));
    // カウント数字
    this.countLabel = Label({
      text:'',
      fill: fontColor,
      fontSize: SCREEN_HEIGHT / 4,
    }).addChildTo(this).setPosition(this.gridX.center(), this.gridY.center());
    //
    this.countDown(this.counter);
  },
  // カウントダウン処理
  countDown: function(counter) {
    var self = this;
    var label = this.countLabel;
    
    label.text = this.counter;
    label.setScale(1.0);
    label.alpha = 0;
    
    this.countLabel.tweener.to({ scaleX: 0.5, scaleY: 0.5, alpha: 1.0 }, 1000)
                           .call(function() {
                             // カウント終了でシーンを抜ける
                             if (self.counter === 1) self.exit();
                             // 再帰呼び出し
                             self.counter--;
                             self.countDown(self.counter);
                           });
  }
});
/*
 * メインシーン
 */
phina.define("MainScene", {
  // 継承
  superClass: 'DisplayScene',
  // 初期化
  init: function(param) {
    // 親クラス初期化
    this.superInit({
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
    });
    // 背景色
    this.backgroundColor = BG_COLOR;
    // グループ
    this.keywordGroup = DisplayElement().addChildTo(this);
    this.disableGroup = DisplayElement().addChildTo(this);
    // 入力文字バッファ
    this.buffer = '';
    // キーワードのインデックス
    this.keyIndex = 0;
    // レベル（文字数）
    this.level = 1;
    // スコア 
    this.score = 0;
    // ライフ
    this.life = 1;
    // ライフ表示
    this.lifeLabel = Label({
      text: 'LIFE: {0}'.format(this.life),
      fill: 'white',
      fontSize: KEYWORD_SIZE * 2 / 3, 
    }).addChildTo(this).setPosition(this.gridX.span(14), this.gridY.span(1));
    // ライフ非表示
    this.lifeLabel.hide();
  },
  // シーンに入ったら
  onenter: function() {
    //カウントシーンを挿入
    this.app.pushScene(CountScene(this.level));
  },
  // シーンに復帰した時
  onresume:function() {
    // ライフ表示
    this.lifeLabel.show();
    // キーワード作成
    this.createKeyword();
  },
  // 毎フレーム更新処理
  update: function() {
    // 画面下到達チェック
    this.checkKeywordToBottom();
  },
  // キーワード作成
  createKeyword: function() {
    // キーワード作成
    var keyword = Keyword(KEYWORDS[this.keyIndex]).addChildTo(this.keywordGroup);
    // 位置
    keyword.right = 0;
    keyword.y = this.gridY.span(13);
    // 速度
    keyword.physical.force(KEYWORD_SPEED_X, KEYWORD_SPEED_Y);
    // 重力
    keyword.physical.setGravity(0, GRAVITY);
    // 発射エフェクト
    Wave().addChildTo(this).setPosition(0, keyword.y);
  },
  // 画面下到達判定
  checkKeywordToBottom: function() {
    var self = this;
    
    this.keywordGroup.children.each(function(keyword) {
      // 画面下に着いたら
      if (keyword.bottom > self.gridY.width) {
        keyword.remove();
        // ミス処理
        self.loseLife();
      }
    });
  },
  // ミス処理
  loseLife: function() {
    this.life--;
    this.lifeLabel.text = 'LIFE: {0}'.format(this.life);
    // ライフ0
    if (this.life === 0) {
      this.showResult();  
    }
    else {
      this.lifeLabel.hide();
      this.app.pushScene(CountScene(this.level));
    }
  },
  // キー入力時処理
  onkeydown: function(e) {
    // 入力文字をバッファに追加
    this.buffer += String.fromCharCode(e.keyCode);
    // 比較 
    this.compare();
  },
  // 入力文字バッファと単語の比較
  compare: function() {
    var buffer = this.buffer.toLowerCase();
    var count = 0;
    var self = this;

    this.keywordGroup.children.each(function(keyword) {
      var str = keyword.text.toLowerCase();
      // 指定した文字で始まるか
      if (str.startsWith(buffer)) {
        // 一致部分をマスク
        keyword.setMask(buffer.length);
        // 完全一致
        if (buffer.length === str.length) {
          // キーワード削除処理
          self.disable(keyword);
        }
        count++;
      }
      else {
        // スペルミスの場合はマスク解除
        keyword.removeMask();
      }
    });
    // 一部一致文字がなければバッファクリア
    if (count === 0) this.buffer = '';
  },
  // キーワード削除処理
  disable: function(keyword) {
    var self = this;
    // 削除グループへ移動
    keyword.addChildTo(this.disableGroup);
    // バッファクリア
    this.buffer = '';
    // スコア更新
    this.score++;
    // インデックス更新
    this.keyIndex++;
    // 削除アニメーション
    keyword.tweener.set({stroke: 'lime', cornerRadius: KEYWORD_SIZE / 8,})
                   .fadeOut(500)
                   .wait(INTERVAL)
                   .call(function() {
                      keyword.remove();
                      // コンプリート
                      if (self.keyIndex === KEYWORDS.lengh - 1) {
                        self.showResult();
                        return;
                      }
                      // 文字数が変わったらレベルアップ
                      if (self.level < KEYWORDS[self.keyIndex].length) {
                        self.levelup();
                        return;
                      }
                      // 次のキーワード作成
                      self.createKeyword();
                    }).play();
  },
  // レベルアップ処理
  levelup: function() {
    this.level++;
    //
    this.setLife(this.level);
    // ライフ非表示
    this.lifeLabel.hide();

    this.app.pushScene(CountScene(this.level));
  },
  // ライフ値セット
  setLife: function(level) {
    var count = 0;

    KEYWORDS.each(function(keyword) {
      // levelと同じ長さのキーワードをカウント
      if (keyword.length === level) count++;
    });
    // ライフ値セット
    this.life = (count / 2) | 0;
    this.lifeLabel.text = 'LIFE: {0}'.format(this.life);
  },
  // 結果表示
  showResult: function() {
    // リザルトシーンへ
    this.app.replaceScene(ResultScene({
      level: this.level,
      score: this.score,
      total: KEYWORDS.length,
    }));      
  },
});
/*
 * リザルトシーン上書き
 */
phina.define('ResultScene', {
  // 継承
  superClass: 'DisplayScene',
  // 継承
  init: function(params) {
    this.superInit({
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
    });
    
    this.backgroundColor = BG_COLOR;
    var fontColor = 'rgb(255,255,255)';
    var fontSize = SCREEN_HEIGHT / 10;
    var buttonSize = SCREEN_HEIGHT / 4;
    var cornerRadius = buttonSize / 4;

    this.fromJSON({
      children: {
        levelText: {
          className: 'Label',
          arguments: {
            text: 'LEVEL {0}'.format(params.level),
            fill: fontColor,
            stroke: null,
            fontSize: fontSize,
          },
          x: this.gridX.center(),
          y: this.gridY.span(2),
        },
        // スコア表示
        scoreLabel: {
          className: 'Label',
          arguments: {
            text: 'shot keywords',
            fill: fontColor,
            stroke: null,
            fontSize: fontSize,
          },
          x: this.gridX.center(),
          y: this.gridY.span(4.5),
        },
        // スコア表示
        scoreText: {
          className: 'Label',
          arguments: {
            text: '{0} / {1}'.format(params.score, params.total),
            fill: fontColor,
            stroke: null,
            fontSize: fontSize,
          },
          x: this.gridX.center(),
          y: this.gridY.span(7),
        },

        shareButton: {
          className: 'Button',
          arguments: [{
            text: 'Tweet',
            width: buttonSize,
            height: buttonSize,
            fontColor: fontColor,
            fontSize: buttonSize / 4,
            cornerRadius: cornerRadius,
              fill: 'rgb(102,217,239)',
            }],
            x: this.gridX.center(-2),
            y: this.gridY.span(12),
          },

          playButton: {
            className: 'Button',
            arguments: [{
              text: 'Retry',
              width: buttonSize,
              height: buttonSize,
              fontColor: fontColor,
              fontSize: buttonSize / 4,
              cornerRadius: cornerRadius,
              fill: 'rgb(253,151,31)',
            }],
            x: this.gridX.center(2),
            y: this.gridY.span(12),

            interactive: true,
            // 押された時
            onpush: function() {
              // メインシーンへ
              this.app.replaceScene(MainScene());
            }.bind(this),
          }
        }
      });
      // ツイートボタンが押された時      
      this.shareButton.onclick = function() {
        var text = 'LEVEL {0} shot keywords {0} / {1}'.format(params.score, params.total);
        var url = phina.social.Twitter.createURL({
          text: text,
          hashtags: 'phina_js,game,keyword_shot',
          url: 'https://alkn203.github.io/phina-games/keyword-shot/',
        });
        window.open(url, 'share window', 'width=480, height=320');
      };
    },
  });
/*
 * キーワードクラス
 */
phina.define("Keyword", {
  // 継承
  superClass: 'RectangleShape',
  // 初期化
  init: function(keyword) {
    // 親クラス初期化
    this.superInit({
      fill: null,
      stroke: null,
    });
    // 文字列
    this.text = keyword;
    // ラベル
    var label = Label({
      text: this.text,
      fill: COLORS.random(),
      fontSize: KEYWORD_SIZE,
    }).addChildTo(this);
    // 実際のサイズ算出
    this.width = label.calcCanvasWidth();
    this.height = label.calcCanvasHeight();
  },
  // マスクをかける
  setMask: function(length) {
    // マスク削除
    this.removeMask();
    // RectangleShapeから作成
    var mask = RectangleShape({
      fill: 'silver',
      stroke: null,
      cornerRadius: KEYWORD_SIZE / 8,
    }).addChildTo(this);
    // 透明度
    mask.alpha = 0.4;
    // 部分文字のラベル
    var label = Label({
      text: this.text.substr(0, length),
      fontSize: KEYWORD_SIZE,
      fill: null,
    }).addChildTo(this);
    // 実際のサイズ算出
    mask.width = label.calcCanvasWidth();
    mask.height = label.calcCanvasHeight();
    // 左端に合わせる
    mask.x = -this.width / 2 + mask.width / 2;
    // 参照用
    this.mask = mask;
  },
  // マスクを消す
  removeMask: function() {
    if (this.mask) this.mask.remove();
  },
});
/*
 * メイン処理
 */
phina.main(function() {
  // アプリケーションを生成
  var app = GameApp({
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    assets: ASSETS,
    //fit: false,
  });
  // 実行
  app.run();
});