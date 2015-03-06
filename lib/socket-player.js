var _ = require('lodash'),
    util = require('util'),
    EventEmitter = require('events').EventEmitter,
    SocketConnection = require('./socket-connection');

module.exports = SocketPlayer;

var ClientMessages = {
    JOIN: "join",
    CONTROL: "control"
};

var ServerMessages = {
    CREATED: "created",
    JOINED: "joined",
    START: "start",
    POSITIONS: "positions",
    APPLE: "apple",
    ERROR: "error"
};

var States = {
    LOBBY: "lobby",
    PLAYING: "playing"
};

/**
 * Game player which uses socket connection as input / output.
 * @param socket
 * @constructor
 */
function SocketPlayer(socket) {
    var self = this;
    self.name = "Anonymous";
    self._state = States.LOBBY;
    self._socketConnection = new SocketConnection(socket);
    self._socketConnection.on('message', function(msgType, data) { self._onMessage(msgType, data); });
    EventEmitter.call(self);
}

util.inherits(SocketPlayer, EventEmitter);

SocketPlayer.prototype.error = function(error) {
    this._socketConnection.sendAndClose(error);
};

SocketPlayer.prototype.onGameCreated = function(gameId) {
    this._socketConnection.sendMessage(ServerMessages.CREATED, {gameId: gameId});
};


SocketPlayer.prototype.onGameEvent = function(eventType, data) {
    switch (eventType) {
        case "start": {
            this._socketConnection.sendMessage(ServerMessages.START, data);
            break;
        }
        case "join": {
            this._state = States.PLAYING;
            this._socketConnection.sendMessage(ServerMessages.JOINED, data);
            break;
        }
        case "positions": {
            this._socketConnection.sendMessage(ServerMessages.POSITIONS, data);
            break;
        }
        case "apple": {
            this._socketConnection.sendMessage(ServerMessages.APPLE, data);
            break;
        }
    }
};

SocketPlayer.prototype._joinToGame = function(data) {
    if(!_.isUndefined(data.player) && !_.isUndefined(data.player.name)) {
        this.name = data.player.name;
    }

    this.emit("join", data.id)
};

SocketPlayer.prototype._onMessage = function(messageType, data) {
    switch (this._state) {
        case States.LOBBY:
            switch (messageType) {
                case ClientMessages.JOIN:
                    this._joinToGame(data);
                    break;
                default:
                    this._sendErrorAndClose("Invalid msg: " + messageType);
            }
            break;
        case States.PLAYING:
            switch (messageType) {
                case ClientMessages.CONTROL:
                    this.emit("control", data);
                    break;
                default:
                    this._sendErrorAndClose("Invalid msg: " + messageType);
            }
            break;
    }
};

/**
 * Sends specified error to the client and closes connection.
 * @param {String} err      Error text
 * @private
 */
SocketPlayer.prototype._sendErrorAndClose = function(err) {
    this._socketConnection.sendAndClose(ServerMessages.ERROR, err);
};