var util = require('util'),
    EventEmitter = require('events').EventEmitter;

module.exports = WebSocketViewer;

function WebSocketViewer(socket) {
    var self = this;
    self.id = socket.id;
    self._socket = socket;
    EventEmitter.call(this);

    socket.on('disconnect', function(){
        self.emit("disconnect");
    });
}

util.inherits(WebSocketViewer, EventEmitter);

WebSocketViewer.prototype.onGameEvent = function(eventType, data) {
    this._socket.emit(eventType, data);
};
