var util = require('util'),
    events = require('events'),
    EventEmitter = events.EventEmitter,
    common = require('./common'),
    Snake = require('./snake');
    Level = require('./level');

var states = {
    NONE: "lobby",
    GAME_INIT: "game-init",
    GAME_PLAY: "game-play",
    END: "end"
};

var SNAKE_COUNT = 2;

module.exports = Game;

function Game() {
    this.id = common.randomValueHex(8);
    this._state = states.GAME_INIT;
    this._players = [];
    this._snakes = [];
    this._level = null;

    EventEmitter.call(this);
}

util.inherits(Game, EventEmitter);

Game.States = states;

Game.prototype.join = function(player) {
    this._players.push(player);
    this.emit("join", {gameId: this.id, player: player});
    if(this._players.length == 2) {
        this.start();
    }
};

Game.prototype.start = function() {
    var self = this;

    var minGapToBorder = 1;

    this._level = new Level();
    this._snakes = [];
    for(var i=0; i < SNAKE_COUNT; i++) {
        var x = common.randomInt(minGapToBorder, this._level.width - 1 - minGapToBorder);
        var y = common.randomInt(minGapToBorder, this._level.height - 1 - minGapToBorder);
        var direction = common.randomInt(1, 4);
        var snake = new Snake(x, y, direction);
        this._snakes.push(snake);
    }

    this._state = states.GAME_PLAY;
    var data = {
        players: this._players,
        level: this._level
    };

    this.emit("start", data);
    setImmediate(function() {self._gameLoop();});
};

Game.prototype.state = function() {
    return this._state;
};

Game.prototype._updatePositions = function() {
    for(var i=0; i < SNAKE_COUNT; i++) {
        this._snakes[i].move();
    }
};


Game.prototype._gameLoop = function() {
    var self = this;
    var delay = 2000;
    //TODO: initial positions should be emitted to the client
    this._updatePositions();
    this.emit("positions", this._snakes);
    setTimeout(function() {self._gameLoop();}, delay);
};