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
    this._viewers = [];
    this._snakes = [];
    this._level = null;
    this._apple = [];
    this._nextGrow = 2;
    this._endRequested = false;

    EventEmitter.call(this);
}

util.inherits(Game, EventEmitter);

Game.States = states;

Game.prototype.addPlayer = function(player) {
    var self = this;
    self._players.push(player);
    player.on("control", function(control) {self._onPlayerControl(player, control);});
    this._gameEvent("join", {gameId: this.id, player: {name: player.name}});
    if(self._players.length == 2) {
        this.start();
    }
};

Game.prototype.addViewer = function(viewer) {
    var self = this;
    this._viewers.push(viewer);
    viewer.on("disconnect", function() {
        self.removeViewer(viewer);
    });
};

Game.prototype.removeViewer = function(viewer) {
    _.remove(this._viewers, function(v) {return v.id === viewer.id;});
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
        players: _.map(this._players, function(player) {return {name: player.name};}),
        level: this._level
    };


    this._gameEvent("start", data);

    this._newApple();
    setImmediate(function() {self._gameLoop();});
};

Game.prototype.end = function() {
    this._endRequested = true;
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
    } while (!emptyLocation);

    this._apple = [x, y];
    this._gameEvent("apple", this._apple);
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
        snake.dieIfCollidingItself();
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
    this._gameEvent("positions", self._snakes);

    if(this._state == states.GAME_PLAY) {
        setTimeout(function() {self._gameLoop();}, delay);
    } else if(this._state == states.END) {
        this._gameEvent("end");
    }
};

Game.prototype._gameEvent = function(eventType, data) {
    var self = this;
    _.each(self._players, function(p) {p.onGameEvent(eventType, data)});
    _.each(self._viewers, function(v) {v.onGameEvent(eventType, data)});
    this.emit(eventType, data);
};

Game.prototype._onPlayerControl = function(player, control) {
    var playerIndex = _.findIndex(this._players, player);
    console.log("Player " + (playerIndex+1) + " control: " + util.inspect(control));

    var currentDirection = this._snakes[playerIndex].direction;

    // Ignore same than current or opposite direction
    if((control.direction == 1 || control.direction == 2) && (currentDirection == 1 || currentDirection == 2)) {
        return;
    }
    if((control.direction == 3 || control.direction == 4) && (currentDirection == 3 || currentDirection == 4)) {
        return;
    }

    this._snakes[playerIndex].direction = control.direction;
};