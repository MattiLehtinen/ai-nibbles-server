var _ = require('lodash'),
    util = require('util'),
    events = require('events'),
    EventEmitter = events.EventEmitter,
    common = require('./common'),
    Snake = require('./snake');
    Level = require('./level');

var states = {
    NONE: "none",
    GAME_INIT: "game-init",
    GAME_PLAY: "game-play",
    END: "end"
};

var SNAKE_COUNT = 2;
var DELAY = 20;

module.exports = Game;

function Game() {
    this.id = common.randomValueHex(8);
    this._state = states.GAME_INIT;
    this._players = [];
    this._snakes = [];
    this._level = null;
    this._apple = [];
    this._nextGrow = 2;
    this._endRequested = false;

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

    this._newApple();
    setImmediate(function() {self._gameLoop();});
};

Game.prototype.end = function() {
    this._endRequested = true;
};

Game.prototype.control = function(player, control) {
    var playerIndex = _.findIndex(this._players, player);
    console.log("Player " + playerIndex+1 + " control: " + util.inspect(control));
    this._snakes[playerIndex].direction = control.direction;
};

Game.prototype.state = function() {
    return this._state;
};

Game.prototype._newApple = function() {

    // TODO: tarkasta onko vapaita ruutuja jäljellä

    do {
        var x = common.randomInt(0, this._level.width-1);
        var y = common.randomInt(0, this._level.height-1);
        var emptyLocation = _.every(this._snakes, function(snake) { return !snake.collides(x,y); });
    } while (!emptyLocation)

    this._apple = [x, y];
    this.emit("apple", this._apple);
};

Game.prototype._updatePositions = function() {
    for(var i=0; i < SNAKE_COUNT; i++) {
        this._snakes[i].move();
    }
};

Game.prototype._checkAppleEaten = function() {
    var self = this;
    var appleEater = _.find(self._snakes, function(snake) {return snake.headCollides(self._apple);});
    if(!_.isUndefined(appleEater)) {
        console.log("EATEN!");
        appleEater.growLength += self._nextGrow;
        self._nextGrow++;
        self._newApple();
    }
};

Game.prototype._updateAlive = function() {
    for(var i=0; i < SNAKE_COUNT; i++) {
        var snake = this._snakes[i];
        snake.dieIfOutside(0, 0, this._level.width-1, this._level.height-1);
        for(var j=0; j<SNAKE_COUNT; j++) {
            if(i == j) continue;
            snake.dieIfCollision(this._snakes[j]);
        }
    }
};

Game.prototype._checkWhoScrewedUp = function() {
    var numAlive = _.where( this._snakes, {alive: true}).length;

    if(numAlive < 2) {
        this._state = states.END;
    }
};

Game.prototype._gameLoop = function() {
    var self = this;
    var delay = DELAY;

    if(this._endRequested) {
        this._state = states.END;
    }

    //TODO: initial positions should be emitted to the client
    this._updatePositions();
    this._checkAppleEaten();
    this._updateAlive();
    this._checkWhoScrewedUp();

    // TODO: send only positions of living snakes and send 'die' event for dead ones
    this.emit("positions", this._snakes);

    if(this._state == states.GAME_PLAY) {
        setTimeout(function() {self._gameLoop();}, delay);
    } else if(this._state == states.END) {
        this.emit("end");
    }
};