(function() {"use strict";var __module = CC_EDITOR ? module : {exports:{}};var __filename = 'preview-scripts/assets/scripts/Game.js';var __require = CC_EDITOR ? function (request) {return cc.require(request, require);} : function (request) {return cc.require(request, __filename);};function __define (exports, require, module) {"use strict";
cc._RF.push(module, '4e12fLSQu1L+KV6QmxDiavU', 'Game', __filename);
// scripts/Game.js

'use strict';

cc.Class({
    extends: cc.Component,

    properties: {
        bgs: {
            default: null,
            type: cc.Node
        },
        gameTimer: {
            default: null,
            type: cc.Label
        },
        timeKeeper: null,

        gameCamera: {
            default: null,
            type: cc.Camera
        },
        starNumber: 1,
        currentStarNumber: 1,
        currentStars: [],
        // 这个属性引用了星星预制资源
        starPrefab: {
            default: null,
            type: cc.Prefab
        },
        redStar: null,
        redStarPrefab: {
            default: null,
            type: cc.Prefab
        },
        scoreFXPrefab: {
            default: null,
            type: cc.Prefab
        },
        iniStarDuration: 5,
        starDuration: 0, // 星星产生后消失时间的随机范围

        gameLevel: 0,
        cameraFarSpeed: 10, // 拉远镜头的等级频率
        starMoreSpeed: 20, // 星星数量增加的频率

        // 地面节点，用于确定星星生成的高度
        ground: {
            default: null,
            type: cc.Node
        },

        // player 节点，用于获取主角弹跳的高度，和控制主角行动开关
        player: {
            default: null,
            type: cc.Node
        },
        thisJumpGetScore: false,
        scoreKeeper: 1,
        // score label 的引用
        scoreDisplay: {
            default: null,
            type: cc.Label
        },
        // 得分音效资源
        scoreAudio: {
            default: null,
            type: cc.AudioClip
        },

        btnNode: {
            default: null,
            type: cc.Node
        },
        gameOverNode: {
            default: null,
            type: cc.Node
        },
        youWinNode: {
            default: null,
            type: cc.Node
        },
        controlHintLabel: {
            default: null,
            type: cc.Label
        },
        keyboardHint: {
            default: '',
            multiline: true
        },
        touchHint: {
            default: '',
            multiline: true
        }
    },

    onLoad: function onLoad() {

        this.iniBg();
        var canvas = this.node;

        // 获取地平面的 y 轴坐标
        this.groundY = this.ground.y + this.ground.height / 2 - 10;

        // store last star's x position
        this.currentStarX = 0;

        // 初始化计时器
        this.timer = 0;

        // is showing menu or running game
        this.enabled = false;

        // initialize control hint
        var hintText = cc.sys.isMobile ? this.touchHint : this.keyboardHint;
        this.controlHintLabel.string = hintText;

        // initialize star and score pool
        this.starPool = new cc.NodePool('Star');
        this.scorePool = new cc.NodePool('ScoreFX');
    },

    iniBg: function iniBg() {
        this.bgs.zIndex = -10;
        var bgChildren = this.bgs.children;
        var l = bgChildren.length;
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = bgChildren[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var i = _step.value;

                i.active = false;
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }

        bgChildren[Math.floor(Math.random() * l)].active = true;
    },

    startGameTimer: function startGameTimer() {
        var time = 0;
        this.timeKeeper = setInterval(function () {
            time += 0.1;
            this.gameTimer.string = "Time: " + time.toFixed(1);
        }.bind(this), 100);
    },
    stopGameTimer: function stopGameTimer() {
        clearInterval(this.timeKeeper);
    },

    onStartGame: function onStartGame() {

        this.iniBg();
        this.gameCamera.zoomRatio = 1;
        // 开始计时
        this.startGameTimer();
        // 初始化计分
        this.resetScore();
        // set game state to running
        this.enabled = true;
        // set button and gameover text out of screen
        this.btnNode.x = 3000;
        this.gameOverNode.active = false;
        this.youWinNode.active = false;
        // reset player position and move speed
        this.player.getComponent('Player').startMoveAt(0, this.groundY);
        // spawn star

        this.starNumber = 1;
        this.starMoreSpeed = 20;
        this.spawnNewStar();
        this.spawnRedStar();
    },

    spawnRedStar: function spawnRedStar() {
        this.redStar = cc.instantiate(this.redStarPrefab);
        this.node.addChild(this.redStar);

        var randY = 500;
        var randX = (Math.random() - 0.5) * 2 * this.node.width / 2;
        this.redStar.setPosition(cc.v2(randX, randY));
        this.redStar.getComponent('RedStar').init(this);
    },

    spawnNewStar: function spawnNewStar() {
        var newStar = null;
        // 使用给定的模板在场景中生成一个新节点
        if (this.starPool.size() > 0) {
            newStar = this.starPool.get(this); // this will be passed to Star's reuse method
        } else {
            newStar = cc.instantiate(this.starPrefab);
        }

        // 将新增的节点添加到 Canvas 节点下面
        this.node.addChild(newStar);
        // 为星星设置一个随机位置
        newStar.setPosition(this.getNewStarPosition());
        // pass Game instance to star
        newStar.getComponent('Star').init(this);

        // start star timer and store star reference
        this.startTimer();
        this.currentStars.push(newStar);
    },

    despawnStar: function despawnStar(star) {
        star.destroy();
        this.currentStarNumber--;
        //如果当前场景中没有星星
        if (!this.currentStarNumber) {
            for (var i = 0; i < this.starNumber; i++) {
                this.spawnNewStar();
            }
            this.currentStarNumber = this.starNumber;
        }
    },


    startTimer: function startTimer() {
        // get a life duration for next star
        this.starDuration = this.iniStarDuration - this.gameLevel / 150;
        this.timer = 0;
    },

    getNewStarPosition: function getNewStarPosition() {
        // 根据地平面位置和主角跳跃高度，随机得到一个星星的 y 坐标
        var randY = this.groundY + Math.random() * this.player.getComponent('Player').jumpHeight + 30;
        // 根据屏幕宽度，随机得到一个星星 x 坐标
        var maxX = this.node.width / 2 + this.gameLevel * 0.6;

        var randX = (Math.random() - 0.5) * 2 * maxX;
        // 返回星星坐标
        return cc.v2(randX, randY);
    },

    gainScore: function gainScore(pos) {
        this.score += this.scoreKeeper;
        // 更新 scoreDisplay Label 的文字
        this.scoreDisplay.string = 'Score: ' + this.score;

        this.thisJumpGetScore = true;

        // 播放特效
        var fx = this.spawnScoreFX();
        var theScoreShow = fx.node.children[0].children[1]._components[0];
        theScoreShow._string = "+" + this.scoreKeeper;
        this.node.addChild(fx.node);
        fx.node.setPosition(pos);
        fx.play();

        // 播放得分音效
        cc.audioEngine.playEffect(this.scoreAudio, false);

        this.scoreKeeper++;
    },
    resetScore: function resetScore() {
        this.score = 0;
        this.scoreDisplay.string = 'Score: ' + this.score;
    },

    spawnScoreFX: function spawnScoreFX() {
        var fx;
        // if (this.scorePool.size() > 0) {
        //     fx = this.scorePool.get();
        //     return fx.getComponent('ScoreFX');
        // } else {
        fx = cc.instantiate(this.scoreFXPrefab).getComponent('ScoreFX');
        fx.init(this);
        return fx;
        // }
    },

    despawnScoreFX: function despawnScoreFX(scoreFX) {
        this.scorePool.put(scoreFX);
    },


    gameUpgrade: function gameUpgrade() {
        this.gameLevel++;
        if (this.gameLevel % this.cameraFarSpeed === 0) {
            this.modifyCamera();
        }
        if (this.gameLevel % this.starMoreSpeed === 0) {
            this.starNumber++;
            this.iniStarDuration += 0.5;
        }
    },

    // 设置镜头
    modifyCamera: function modifyCamera() {
        var times = 0;
        var modify = setInterval(function () {
            this.gameCamera.zoomRatio *= 999 / 1000;
            times++;
            // if(times==400){
            if (times == 12) {
                clearInterval(modify);
            }
        }.bind(this), 40);
    },

    update: function update(dt) {
        // 每帧更新计时器，超过限度还没有生成新的星星
        // 就会调用游戏失败逻辑
        if (this.timer > this.starDuration) {
            this.gameOver();
            this.enabled = false; // disable gameOver logic to avoid load scene repeatedly
            return;
        }
        this.timer += dt;
    },

    gameWin: function gameWin() {
        this.youWinNode.active = true;
        this.again();
    },

    gameOver: function gameOver() {
        this.gameOverNode.active = true;
        this.again();
    },

    again: function again() {
        this.player.getComponent('Player').stopMove();
        this.stopGameTimer();
        this.gameLevel = 0;
        this.iniStarDuration = 6;
        this.btnNode.x = 0;
        this.enabled = false;
        this.currentStarNumber = 1;
        this.starPool.clear();
        this.redStar.destroy();
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
            for (var _iterator2 = this.currentStars[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                var i = _step2.value;

                i.destroy();
            }
        } catch (err) {
            _didIteratorError2 = true;
            _iteratorError2 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion2 && _iterator2.return) {
                    _iterator2.return();
                }
            } finally {
                if (_didIteratorError2) {
                    throw _iteratorError2;
                }
            }
        }

        this.currentStars = [];
    }

});

cc._RF.pop();
        }
        if (CC_EDITOR) {
            __define(__module.exports, __require, __module);
        }
        else {
            cc.registerModuleFunc(__filename, function () {
                __define(__module.exports, __require, __module);
            });
        }
        })();
        //# sourceMappingURL=Game.js.map
        