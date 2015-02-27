var net = require('net'),
    util = require('util'),
    EventEmitter = require('events').EventEmitter,
    SocketPlayer = require('./socket-player');

module.exports = SocketServer;

function SocketServer(host, socketPort) {
    this._host = host;
    this._socketPort = socketPort;
    this._server = null;
    EventEmitter.call(this);
}

util.inherits(SocketServer, EventEmitter);

SocketServer.prototype.start = function(callback) {
    var self = this;
    self._server = net.createServer();
    self._server.listen(self._socketPort, self._host, function(err) {
        self._server.on('connection', function(socket) {self._onConnection(socket);});
        console.log('Socket server listening on ' + self._server.address().address +':'+ self._server.address().port);
        callback(err);
    });
};

SocketServer.prototype._onConnection = function(socket) {

    var socketPlayer = new SocketPlayer(socket);
    this.emit("new_player", socketPlayer);
    /*
    var gameConnection = new SocketPlayer(socket);
    var gameCoordinator = new GameCoordinator(gameConnection, games);

    gameCoordinator.on("game_create", function(game) {
        console.log("game_create");
        game.on("start", function(data) {
            console.log("game start");

            if(latestGame) {
                latestGame.removeListener("positions", positionsListener);
                latestGame.removeListener("end", endListener);
                console.log("Removed old positions listener");
            }

            latestGame = game;

            latestGame.on("positions", positionsListener);
            latestGame.on("apple", appleListener);
            latestGame.on("end", endListener);

            _.each(streamLatestWebSockets, function(webSocket) {
                webSocket.emit("start", data);
                console.log("WEB SOCKET. Start sent to " + webSocket.id);
            });

            console.log("Latest game: " + latestGame.id);
        });

    });
    */
};

/*

function appleListener(data) {
    sendToViewers("apple", data);}

function positionsListener(data) {
    sendToViewers("positions", data);}

function endListener() {
    sendToViewers("end");
}

function sendToViewers(messageType, data) {
    _.each(streamLatestWebSockets, function(webSocket) {
        webSocket.emit(messageType, data);
        console.log("WEB SOCKET. '" + messageType + "' sent to " + webSocket.id);
    });
}
*/

