var _ = require('lodash'),
    util = require('util'),
    EventEmitter = require('events').EventEmitter,
    Game = require('./game');

module.exports = Lobby;


/**
 * Creates a new Lobby.
 * This class is responsible for managing available games and creating new ones.
 * @constructor
 * @extends EventEmitter
 */
function Lobby() {
    this._games = {}; // dictionary of available games {gameId: Game}
    this._latestGame = null;
    this._viewers = [];
    EventEmitter.call(this);
}

util.inherits(Lobby, EventEmitter);

/**
 * Add new player to lobby.
 * @param {object} player
 */
Lobby.prototype.addPlayer = function(player) {
    var self = this;
    console.log("New player!");
    player.on("join", function(gameId) {self._onJoinGame(player, gameId)});
};

/**
 * Add new viewer to lobby.
 * @param {object} viewer
 */
Lobby.prototype.addViewer = function(viewer) {
    var self = this;
    self._viewers.push(viewer);
    console.log("New viewer. Total: " + self._viewers.length);

    viewer.on('disconnect', function() {
        self._viewers = _.without(self._viewers,  _.findWhere(self._viewers, {id: viewer.id}));
        console.log("Viewer disconnected. Total: " + self._viewers.length);
    });
};


/**
 * Player has requested to join to a game.
 * @param {object} player
 * @param {string} [gameId]     Id of the game. If undefined, first game with available slots will be joined to.
 * @private
 */
Lobby.prototype._onJoinGame = function(player, gameId) {
    if(_.isUndefined(gameId)) {
        // Try to find existing game
        var game = _.find(this._games, function(game) {return game.state() === Game.States.GAME_INIT;});
        if(!game) {
            // Create a new game if there are no existing game waiting for players
            game = this._createGame(player);
        }
    } else {
        if(_.isUndefined(this._games[gameId])) return player.error("game " + gameId + " not found");
        game = this._games[gameId];
    }

    game.addPlayer(player);
};

/**
 * Creates a new game and informs specified player about creation.
 * @param {object} player
 * @returns {Game}  Created game.
 * @private
 */
Lobby.prototype._createGame = function(player) {
    var self = this;
    var game = new Game();
    this._games[game.id] = game;
    player.onGameCreated(game.id);

    // Update viewers for latest game
    if(self._latestGame) {
        _.each(self._viewers, function(viewer) { self._latestGame.removeViewer(viewer);});
    }
    _.each(self._viewers, function(viewer) { game.addViewer(viewer);});
    this._latestGame = game;
    this.emit("game_create", game);
    return game;
};