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

var SNAKE_COUNT = 2;     // Number of snakes
var START_DELAY = 5000;  // Time on wait on game start in ms.
var DELAY = 50;          // Delay between frames in milliseconds
var TIME_LIMIT = 5 * 60; // Maximum playing time in seconds

module.exports = Game;

/**
 * Creates a new game.
 * @constructor
 * @extends EventEmitter
 */
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
    this._startTime = null; // Start time in milliseconds
    this._endTime = null; // End time in milliseconds
    this._tick = 0;

    EventEmitter.call(this);
}

util.inherits(Game, EventEmitter);

Game.States = states;

/**
 * Add specified player to the game.
 * @param {object} player
 * @emits Game#join
 */
Game.prototype.addPlayer = function(player) {
    var self = this;
    self._players.push(player);
    player.on("control", function(control) {self._onPlayerControl(player, control);});
    this._gameEvent("join", {gameId: this.id, player: {name: player.name}});
    if(self._players.length == 2) {
        this.start();
    }
};

/**
 * Add specified viewer to the game.
 * @param {object} viewer
 */
Game.prototype.addViewer = function(viewer) {
    var self = this;
    this._viewers.push(viewer);
    viewer.on("disconnect", function() {
        self.removeViewer(viewer);
    });
};

/**
 * Removes specified viewer from the game.
 * @param viewer
 */
Game.prototype.removeViewer = function(viewer) {
    _.remove(this._viewers, function(v) {return v.id === viewer.id;});
};

/**
 * Starts the game.
 * @emits Game#start
 */
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
    this._sendPositions(TIME_LIMIT*1000);
    setTimeout(function() {
        self._startTime = +new Date();
        self._endTime = self._startTime + TIME_LIMIT * 1000;
        self._gameLoop();
    }, START_DELAY);
};

/**
 * Ends the game.
 */
Game.prototype.end = function() {
    this._endRequested = true;
};

/**
 * Gets the state of the game.
 * @returns {string}    Game state. See Game.states.
 */
Game.prototype.state = function() {
    return this._state;
};

/**
 * Sets new random position for the apple.
 * @private
 */
Game.prototype._newApple = function() {

    // Check whether the level is full. No new position for the apple is randomized in that case.
    var levelSize = this._level.width * this._level.height;
    var snakeSizes = 0;
    _.forEach(this._snakes, function(snake) {
        snakeSizes += snake.currentLength();
    });
    if(snakeSizes === levelSize) {
        this._apple = [-1, -1];
        return;
    }


    do {
        var x = common.randomInt(0, this._level.width-1);
        var y = common.randomInt(0, this._level.height-1);
        var emptyLocation = _.every(this._snakes, function(snake) { return !snake.collides(x,y); });
    } while (!emptyLocation);

    this._apple = [x, y];
    this._gameEvent("apple", this._apple);
};

/**
 * Moves all the snakes.
 * @private
 */
Game.prototype._updatePositions = function() {
    for(var i=0; i < SNAKE_COUNT; i++) {
        this._snakes[i].move();
    }
};

/**
 * Checks whether someone has eaten the apple, grows that snake and randomizes new position for the apple.
 * @private
 */
Game.prototype._checkAppleEaten = function() {
    var self = this;
    var appleEater = _.find(self._snakes, function(snake) {return snake.headCollides(self._apple);});
    if(!_.isUndefined(appleEater)) {
        appleEater.growLength += self._nextGrow;
        self._nextGrow++;
        self._newApple();
    }
};

/**
 * Updates alive state of the snakes.
 * @private
 */
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

/**
 * Returns array of winner if game ends. Null is returned if game continues.
 * @param {int} timeLeft    How much there is time left (in ms)
 * @returns {Array|null}
 * @private
 */
Game.prototype._getWinners = function(timeLeft) {
    var alive = _.where( this._snakes, {alive: true});
    var numAlive = alive.length;
    var winners = null;

    if(numAlive <= 1) {
        winners = alive;
    }
    else if(timeLeft <= 0) {
        var maxGrowLength = _.max(this._snakes, "growLength").growLength;
        winners = _.filter(this._snakes, "growLength", maxGrowLength);
    }
    return winners;
};

/**
 * Main game loop.
 * @private
 */
Game.prototype._gameLoop = function() {
    var self = this;
    var delay = DELAY;

    this._tick++;
    common.log("#" + self._tick);

    if(this._endRequested) {
        this._state = states.END;
    }

    this._updatePositions();
    this._checkAppleEaten();

    var timeLeft = Math.max(0, this._endTime - new Date());
    this._updateAlive(timeLeft);

    var winners = this._getWinners(timeLeft);
    if(winners !== null) {
        this._state = states.END;
    }

    // TODO: send only positions of living snakes and send 'die' event for dead ones
    this._sendPositions(timeLeft);

    if(this._state == states.GAME_PLAY) {
        setTimeout(function() {self._gameLoop();}, delay);
    } else if(this._state == states.END) {
        var winnerIndices = [];
        _.forEach(winners, function(winner) {
            var winnerIndex = self._snakes.indexOf(winner);
            winnerIndices.push(winnerIndex);
        });
        this._gameEvent("end", {
            winners: winnerIndices
        });
    }
};

/**
 * Sends positions game event to the clients.
 * @param {int} timeLeft    Time left in milliseconds.
 * @private
 */
Game.prototype._sendPositions = function(timeLeft) {
    var self = this;
    this._gameEvent("positions", {
        snakes: self._snakes,
        timeLeft: timeLeft
    });
};

/**
 * Sends specified game event for the players and the viewers.
 * Emits also the specified event.
 * @param {string} eventType    Type of the event.
 * @param {object} data         Event specific data.
 * @private
 */
Game.prototype._gameEvent = function(eventType, data) {
    var self = this;
    _.each(self._players, function(p) {p.sendGameEvent(eventType, data)});
    _.each(self._viewers, function(v) {v.sendGameEvent(eventType, data)});
    this.emit(eventType, data);
};

/**
 * Handles snake control messages.
 * @param {object} player   Player who sent control message.
 * @param {object} control  Control data.
 * @private
 */
Game.prototype._onPlayerControl = function(player, control) {
    var playerIndex = _.findIndex(this._players, player);

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

// Events:

/**
 * New player has joined.
 *
 * @event Game#join
 * @type {object}
 */

/**
 * Game starts.
 *
 * @event Game#start
 * @type {object}
 */