var net = require('net'),
    util = require('util'),
    EventEmitter = require('events').EventEmitter,
    common = require('./common'),
    SocketPlayer = require('./socket-player');

module.exports = SocketServer;

/**
 * Creates SocketServer. Call `start`-method to start the server.
 * @param {string}  host          Host where clients must connect to. Set to undefined to listen all ipv4 addresses.
 * @param {int}     socketPort    Port to listen.
 * @constructor
 * @extends EventEmitter
 */
function SocketServer(host, socketPort) {
    this._host = host;
    this._socketPort = socketPort;
    this._server = null;
    EventEmitter.call(this);
}

util.inherits(SocketServer, EventEmitter);

/**
 * Callback used by start function.
 * @callback SocketServer~startCallback
 * @param {string|null} err     Error string if an error occurred.
 */
/**
 * Starts the server
 * @param {SocketServer~startCallback} callback     Callback function.
 */
SocketServer.prototype.start = function(callback) {
    var self = this;
    self._server = net.createServer();
    self._server.listen(self._socketPort, self._host, function(err) {
        self._server.on('connection', function(socket) {self._onConnection(socket);});
        common.log('Socket server listening on ' + self._server.address().address +':'+ self._server.address().port);
        callback(err);
    });
};

/**
 * Handles new connections.
 * @param {object} socket       Socket handle of the connected client.
 * @emits SocketServer#new_player
 * @private
 */
SocketServer.prototype._onConnection = function(socket) {

    var socketPlayer = new SocketPlayer(socket);
    this.emit("new_player", socketPlayer);
};


/**
 * New player has joined.
 *
 * @event SocketServer#new_player
 * @type {SocketPlayer}
 */