var util = require('util'),
    EventEmitter = require('events').EventEmitter;

module.exports = WebSocketViewer;

/**
 * Creates a new WebSocketViewer
 * @param {object} socket   Socket.io web socket handle
 * @extends EventEmitter
 * @constructor
 */
function WebSocketViewer(socket) {
    var self = this;
    self.id = socket.id;
    self._socket = socket;
    EventEmitter.call(this);

    socket.on('disconnect', function(){
        /**
         * Socket disconnected.
         * @event WebSocketViewer#disconnect
         */
        self.emit("disconnect");
    });
}

util.inherits(WebSocketViewer, EventEmitter);

/**
 * Sends specified game event for the viewer via web socket.
 * @param {string} eventType    Type of the event.
 * @param {object} data         Event specific data.
 */
WebSocketViewer.prototype.sendGameEvent = function(eventType, data) {
    this._socket.emit(eventType, data);
};
