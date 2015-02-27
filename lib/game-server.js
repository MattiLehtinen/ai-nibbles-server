var async = require('async'),
    SocketServer = require("./socket-server"),
    WebSocketViewerServer = require("./web-socket-viewer-server"),
    Lobby = require("./lobby");

module.exports = GameServer;

function GameServer(host, socketPort, webSocketPort) {
    var self = this;
    self._lobby = new Lobby();
    self._lobby.on("game_create", function(game) {self._onGameCreated(game);});
    self._playerServer = new SocketServer(host, socketPort);
    self._viewerServer = new WebSocketViewerServer(webSocketPort);
}

GameServer.prototype.start = function(callback) {
    var self = this;

    async.parallel([
        function(callback) {self._startSocketServer(callback);},
        function(callback) {self._startWebSocketViewerServer(callback);}
    ], function(err, results) {
        if(err) {
            console.log("Error: " + err);
        }
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