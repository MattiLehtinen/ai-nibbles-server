var _ = require('lodash'),
    util = require('util'),
    JSONStream = require('JSONStream'),
    EventEmitter = require('events').EventEmitter;

module.exports = SocketConnection;

/**
 * Creates a new SocketConnection using specified socket.
 * @param {object} socket   Socket handle.
 * @extends EventEmitter
 * @constructor
 */
function SocketConnection(socket) {
    var self = this;
    this._socket = socket;

    var jsonStream = this._socket.pipe(JSONStream.parse());
    jsonStream.on('data', function(data) {self._onData(data);});
    this._socket.on('close', function() {self._onClose();});
    this._socket.on('error', function(err) {self._onError(err);});

    this.remoteAddress = socket.remoteAddress;
    this.remotePort = socket.remotePort;

    EventEmitter.call(this);
}

util.inherits(SocketConnection, EventEmitter);


/**
 * Sends the specified message and data to the client.
 * @param {String} message      Message type. See `ServerMessages` of `SocketPlayer`.
 * @param {Object} data         Data to be sent to the client.
 */
SocketConnection.prototype.sendMessage = function(message, data) {
    this._send({msg: message, data: data});
};

/**
 * Sends the specified message to the client and destroys the socket.
 * @param {String} message      Message type. See `ServerMessages` of `SocketPlayer`.
 * @param {Object} data         Data to be sent to the client.
 */
SocketConnection.prototype.sendAndClose = function(message, data) {
    this.sendMessage(message, data);
    this._socket.destroy();
};

/**
 * Handles 'socket closed' event.
 * @private
 */
SocketConnection.prototype._onClose = function() {
    this._terminate();
};

/**
 * Handles 'error' event.
 * @private
 */
SocketConnection.prototype._onError = function(err) {
    this._log("ERROR: " + err);
    this._terminate();
};

/**
 * Handles raw data sent from the client
 * @param {Object} data     Object sent to the socket
 * @private
 */
SocketConnection.prototype._onData = function(data) {
    this._log("RECEIVED: " + JSON.stringify(data));

    if(_.isUndefined(data.msg)) {
        return this._syntaxError("msg is not defined");
    }
    if(_.isUndefined(data.data)) {
        return this._syntaxError("data is not defined");
    }

    this.emit("message", data.msg, data.data);
};


/**
 * Sends specified data to the client as JSON string.
 * @param {Object} data     Data to be sent
 * @private
 */
SocketConnection.prototype._send = function(data) {
    var jsonData = JSON.stringify(data);
    this._socket.write(jsonData);
};


/**
 * Ends current game. Call this on unrecoverable error situation (e.g. connection lost).
 * @private
 */
SocketConnection.prototype._terminate = function() {

    // TODO: Inject game object or send terminate event.
    // This does currently nothing.
    if(this._game) {
        this._game.end();
        delete this._games[this._game.id];
        this._game = null;
    }
};

/**
 * Sends specified error to the client with 'SYNTAX ERROR' and destroys the socket.
 * @param {String} err      Error text
 * @private
 */
SocketConnection.prototype._syntaxError = function(err) {
    this.sendAndClose("SYNTAX ERROR",  err);
};

/**
 * Logs text
 * @param {String} text     Text to be logged.
 * @private
 */
SocketConnection.prototype._log = function(text) {
    var msg = this.remoteAddress +':'+ this.remotePort;
    msg +=  " | " + text;
    console.log(msg);
};