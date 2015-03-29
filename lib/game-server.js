var async = require('async'),
    SocketServer = require("./socket-server"),
    WebSocketViewerServer = require("./web-socket-viewer-server"),
    Lobby = require("./lobby");

module.exports = GameServer;

/**
 * Creates a new AI Nibbles GameServer.
 * Call start to begin listening for connections.
 * @param {string}  host            Host which is listened for  player connections. Set to undefined to listen all ipv4 addresses.
 * @param {int}     socketPort      Port which is listened for player connections.
 * @param {int}     webSocketPort   Port which is listened for viewer connections.
 * @constructor
 */
function GameServer(host, socketPort, webSocketPort) {
    var self = this;
    self._lobby = new Lobby();
    self._lobby.on("game_create", function(game) {self._onGameCreated(game);});
    self._playerServer = new SocketServer(host, socketPort);
    self._viewerServer = new WebSocketViewerServer(webSocketPort);
}

/**
 * Starts listening for player and viewer connections.
 * @param {Function} callback   Callback function.
 */
GameServer.prototype.start = function(callback) {
    var self = this;

    async.parallel([
        function(callback) {self._startSocketServer(callback);},
        function(callback) {self._startWebSocketViewerServer(callback);}
    ], function(err, results) {
        if(err) {
            console.log("Error: " + err);
        }
        return callback(err);
    });
};

GameServer.prototype._onGameCreated = function(game) {
    console.log("New game created: " + game.id);
};

GameServer.prototype._onNewPlayer = function(player) {
    this._lobby.addPlayer(player);
};

GameServer.prototype._onNewViewer = function(viewer) {
    this._lobby.addViewer(viewer);
};

GameServer.prototype._startSocketServer = function(callback) {
    var self = this;
    self._playerServer.on("new_player", function(player) {self._onNewPlayer(player);});
    self._playerServer.start(function(err) {
        if(err) return callback(err);
        callback(null);
    });
};

GameServer.prototype._startWebSocketViewerServer = function(callback) {
    var self = this;
    self._viewerServer.on("new_viewer", function(viewer) {self._onNewViewer(viewer);});
    self._viewerServer.start(function(err) {
        if(err) return callback(err);
        callback(null);
    });
};