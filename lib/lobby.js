var _ = require('lodash'),
    util = require('util'),
    EventEmitter = require('events').EventEmitter,
    Game = require('./game');

module.exports = Lobby;


function Lobby() {
    this._games = {}; // dictionary of available games {gameId: Game}
    this._latestGame = null;
    this._viewers = [];
    EventEmitter.call(this);
}

util.inherits(Lobby, EventEmitter);

Lobby.prototype.addPlayer = function(player) {
    var self = this;
    console.log("New player!");
    player.on("join", function(gameId) {self._onJoinGame(player, gameId)});
};

Lobby.prototype.addViewer = function(viewer) {
    var self = this;
    self._viewers.push(viewer);
    console.log("New viewer. Total: " + self._viewers.length);

    viewer.on('disconnect', function() {
        self._viewers = _.without(self._viewers,  _.findWhere(self._viewers, {id: viewer.id}));
        console.log("Viewer disconnected. Total: " + self._viewers.length);
    });
};


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