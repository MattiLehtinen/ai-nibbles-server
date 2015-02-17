var _ = require('lodash'),
    util = require('util'),
    Game = require('./game'),
    GameConnection = require('./game-connection'),
    ClientMessages = GameConnection.ClientMessages,
    ServerMessages = GameConnection.ServerMessages,
    events = require('events'),
    EventEmitter = events.EventEmitter;

module.exports = GameCoordinator;

function GameCoordinator(gameConnection, games) {
    var self = this;
    this._gameConnection = gameConnection;
    this._games = games;
    this._game = null;
    this._player = null;

    this._gameConnection.on("message", function(message) {self._onMessage(message);});

    this._log("CONNECTED");
    EventEmitter.call(this);
}

util.inherits(GameCoordinator, EventEmitter);

GameCoordinator.prototype._createGame = function(data) {
    this._game = new Game();

    this._games[this._game.id] = this._game;
    this._gameConnection.sendMessage(ServerMessages.CREATED, {gameId: this._game.id});
    this._joinGame(data.player);
};

GameCoordinator.prototype._gameState = function() {
    if(!this._game) {
        return Game.States.NONE;
    } else {
        return this._game.state();
    }
};

GameCoordinator.prototype._onJoinGame = function(data) {
    var gameId;
    if(_.isUndefined(data.gameId)) {
        // Try to find existing game
        var game = _.find(this._games, function(game) {return game.state() === Game.States.GAME_INIT;});
        if(!game) {
            // Create a new game if there are no existing game waiting for players
            this._createGame(data);
            return;
        }
        gameId = game.id;
    } else {
        gameId = data.gameId;
    }


    if(_.isUndefined(this._games[gameId])) return this._gameConnection.sendErrorAndClose("game " + gameId + " not found");

    this._game = this._games[gameId];
    this._joinGame(data.player);
};

GameCoordinator.prototype._joinGame = function(player) {
    var self = this;
    this._player = player;
    this._game.on("join", function(data) {self._onGameJoin(data);});
    this._game.on("start", function(players) {self._onGameStart(players);});
    this._game.on("positions", function(data) {self._onGamePositions(data);});
    this._game.join(this._player);
};

GameCoordinator.prototype._onGameJoin = function(data) {
    this._gameConnection.sendMessage(ServerMessages.JOINED, data);
};

GameCoordinator.prototype._onGamePositions = function(data) {
    this._gameConnection.sendMessage(ServerMessages.POSITIONS, data);
};

GameCoordinator.prototype._onGameStart = function(players) {
    var data = {players: players};
    this._gameConnection.sendMessage(ServerMessages.START, data);
    this.emit("game_start", {game: this._game, players: players});
};

/**
 * Handles parsed message
 * @param {Object} message      Message with `msg` and `data` parameters.
 * @private
 */
GameCoordinator.prototype._onMessage = function(message) {
    var initialState = this._gameState();
    var messageType = message.msg;
    var data = message.data;

    switch (this._gameState()) {
        case Game.States.NONE:
            switch (messageType) {
                case ClientMessages.CREATE:
                    this._createGame(data);
                    break;
                case ClientMessages.JOIN:
                    this._onJoinGame(data);
                    break;
                default:
                    this._gameConnection.sendErrorAndClose("Invalid msg: " + messageType);
            }
            break;
        case Game.states.GAME:
            break;
    }

    var endState = this._gameState();
    if(initialState != endState) {
        this._log("State " + initialState + " -> " + endState);
    }
};

/**
 * Logs text
 * @param {String} text     Text to be logged.
 * @private
 */
GameCoordinator.prototype._log = function(text) {
    var msg = this._gameConnection.remoteAddress +':'+ this._gameConnection.remotePort;
    if(this._game) {
        msg += " | " + this._game.id
    }

    msg +=  " | " + text;
    console.log(msg);
};


GameCoordinator.prototype._validate = function(obj, param) {
    if(_.isUndefined(obj[param]))
    {
        this._gameConnection.sendErrorAndClose(param + " is undefined");
        return false;
    }
    return true;
};
