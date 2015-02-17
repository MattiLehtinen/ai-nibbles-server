var _ = require('lodash'),
    util = require('util'),
    events = require('events'),
    EventEmitter = events.EventEmitter;


module.exports = GameConnection;

function GameConnection(socket, games) {
    var self = this;
    this._socket = socket;

    this._socket.on('data', function(data) {self._onData(data);});
    this._socket.on('close', function() {self._onClose();});

    this.remoteAddress = socket.remoteAddress;
    this.remotePort = socket.remotePort;

    EventEmitter.call(this);
}

util.inherits(GameConnection, EventEmitter);

GameConnection.ClientMessages = {
    CREATE: "create",
    JOIN: "join"
};

GameConnection.ServerMessages = {
    CREATED: "created",
    JOINED: "joined",
    START: "start",
    POSITIONS: "positions",
    ERROR: "error"
};

/**
 * Sends specified message and data to the client.
 * @param {String} message      Message type. See `serverMessages`.
 * @param {Object} data         Data to be sent to the client.
 * @private
 */
GameConnection.prototype.sendMessage = function(message, data) {
    this._send({msg: message, data: data});
};

/**
 * Sends specified error to the client and destoroys the socket.
 * @param {String} err      Error text
 * @private
 */
GameConnection.prototype.sendErrorAndClose = function(err) {
    this._sendError(err);
    this._socket.destroy();
};

/**
 * Handles 'socket closed' event.
 * @private
 */
GameConnection.prototype._onClose = function() {
    // TODO: End game first
    if(this._game) {
        delete this._games[this._game.id];
        this._game = null;
    }
};

/**
 * Handles raw data sent from the client
 * @param {String} data     Data sent to the socket
 * @private
 */
GameConnection.prototype._onData = function(data) {
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

    this.emit("message", jsonData);
};


/**
 * Sends specified data to the client as JSON string.
 * @param {Object} data     Data to be sent
 * @private
 */
GameConnection.prototype._send = function(data) {
    var jsonData = JSON.stringify(data);
    this._log("SENT: " + jsonData);
    this._socket.write(jsonData);
};


/**
 * Sends specified error to the client as JSON string.
 * @param {String} err      Error text
 * @private
 */
GameConnection.prototype._sendError = function(err) {
    this._send({msg:GameConnection.ServerMessages.ERROR, data: err});
};

/**
 * Sends specified error to the client with 'SYNTAX ERROR' and destroys the socket.
 * @param {String} err      Error text
 * @private
 */
GameConnection.prototype._syntaxError = function(err) {
    this.sendErrorAndClose("SYNTAX ERROR. " + err);
};

/**
 * Logs text
 * @param {String} text     Text to be logged.
 * @private
 */
GameConnection.prototype._log = function(text) {
    var msg = this.remoteAddress +':'+ this.remotePort;
    msg +=  " | " + text;
    console.log(msg);
};