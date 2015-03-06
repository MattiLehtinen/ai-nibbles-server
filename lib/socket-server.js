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

};
