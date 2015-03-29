var _ = require('lodash'),
    util = require('util'),
    EventEmitter = require('events').EventEmitter,
    SocketConnection = require('./socket-connection');

module.exports = SocketPlayer;

var ServerMessages = {
    CREATE: "create",
    JOIN: "join",
    ERROR: "error"
};

var ClientMessages = {
    JOIN: "join",
    CONTROL: "control"
};

var States = {
    LOBBY: "lobby",
    PLAYING: "playing"
};

/**
 * Creates a new SocketPlayer.
 * Reprsenets a player for the game which uses socket connection as input / output.
 * @param {object} socket   Socket handle
 * @constructor
 * @extends EventEmitter
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

/**
 * Informs about specified error and closes the underlying socket.
 * @param {string} error    Error text.
 */
SocketPlayer.prototype.error = function(error) {
    this._socketConnection.sendAndClose(error);
};

/**
 * Called when a new game is created. Informs underlying socket about created game.
 * @param {string}  gameId      Id of the game.
 */
SocketPlayer.prototype.onGameCreated = function(gameId) {
    this._socketConnection.sendMessage(ServerMessages.CREATE, {gameId: gameId});
};

/**
 * Called when a game event occurs. Sends the event for the underlying socket.
 * @param {string} eventType    Type of the event.
 * @param {object} data         Event specific data.
 */
SocketPlayer.prototype.sendGameEvent = function(eventType, data) {

    if(eventType == ServerMessages.JOIN) {
        this._state = States.PLAYING;
    }

    this._socketConnection.sendMessage(eventType, data);
};

/**
 * Emits join message to join this player to a game.
 * @param {object} data     Join data. {id: string, player: {name: string}}
 * @private
 */
SocketPlayer.prototype._joinToGame = function(data) {
    if(!_.isUndefined(data.player) && !_.isUndefined(data.player.name)) {
        this.name = data.player.name;
    }

    this.emit(ServerMessages.JOIN, data.id)
};

/**
 * Handles the messages sent by client.
 * @param {string} messageType      Type of the message.
 * @param {object} data             Message specific data.
 * @private
 */
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