var util = require('util'),
    events = require('events'),
    EventEmitter = events.EventEmitter,
    common = require('./common'),
    Snake = require('./snake');

var states = {
    NONE: "lobby",
    GAME_INIT: "game-init",
    GAME_PLAY: "game-play",
    END: "end"
};

module.exports = Game;

function Game() {
    this.id = common.randomValueHex(8);
    this._state = states.GAME_INIT;
    this._players = [];
    this._snakes = [];
    this._level = [];

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

    var width = 10;
    var height = 10;
    var row = new Array(width).map(function() { return 0;});
    this._level = new Array(height).map(function() {return row;});

    this._snakes = [];
    for(var i=0; i<2; i++) {

        var x = common.randomInt(1, width-2);
        var y = common.randomInt(1, height-2);
        var direction = common.randomInt(1, 4);
        var snake = new Snake(x, y, direction);
        this._snakes.push(snake);
    }

    this._state = states.GAME_PLAY;
    this.emit("start", this._players);
    setImmediate(function() {self._gameLoop();});
};

Game.prototype.state = function() {
    return this._state;
};

Game.prototype._updatePositions = function() {
    for(var i=0; i<2; i++) {
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