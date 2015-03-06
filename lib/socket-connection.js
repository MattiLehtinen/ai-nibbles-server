var _ = require('lodash'),
    util = require('util'),
    EventEmitter = require('events').EventEmitter;

module.exports = SocketConnection;

function SocketConnection(socket) {
    var self = this;
    this._socket = socket;

    this._socket.on('data', function(data) {self._onData(data);});
    this._socket.on('close', function() {self._onClose();});
    this._socket.on('error', function(err) {self._onError(err);});

    this.remoteAddress = socket.remoteAddress;
    this.remotePort = socket.remotePort;

    EventEmitter.call(this);
}

util.inherits(SocketConnection, EventEmitter);


/**
 * Sends specified message and data to the client.
 * @param {String} message      Message type. See `ServerMessages` of `SocketPlayer`.
 * @param {Object} data         Data to be sent to the client.
 */
SocketConnection.prototype.sendMessage = function(message, data) {
    this._send({msg: message, data: data});
};

/**
 * Sends specified message to the client and destroys the socket.
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
 * @param {String} data     Data sent to the socket
 * @private
 */
SocketConnection.prototype._onData = function(data) {
    var trimmed = _.trim(data);
    this._log("RECEIVED: " + trimmed);

    var jsonData;
    try {
        jsonData = JSON.parse(trimmed);
    } catch (err) {
        return this._syntaxError(err);
    }

    if(_.isUndefined(jsonData.msg)) {
        return this._syntaxError("msg is not defined");
    }
    if(_.isUndefined(jsonData.data)) {
        return this._syntaxError("data is not defined");
    }

    this.emit("message", jsonData.msg, jsonData.data);
};


/**
 * Sends specified data to the client as JSON string.
 * @param {Object} data     Data to be sent
 * @private
 */
SocketConnection.prototype._send = function(data) {
    var jsonData = JSON.stringify(data);
    this._socket.write(jsonData);
    this._log("SENT: " + jsonData);
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