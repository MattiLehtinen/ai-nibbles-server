var util = require('util'),
    EventEmitter = require('events').EventEmitter,
    http = require('http'),
    socketIO = require('socket.io'),
    WebSocketViewer = require('./web-socket-viewer');

module.exports = WebSocketViewerServer;

/**
 *  HTTP socket.io server for viewers
 * @constructor
 */
function WebSocketViewerServer(port) {
    this.port = port;
    EventEmitter.call(this);
}

util.inherits(WebSocketViewerServer, EventEmitter);

WebSocketViewerServer.prototype.start = function(callback) {
    var self = this;
    var httpServer = http.createServer();
    var io = socketIO(httpServer);

    io.on('connection', function(socket) {self.onConnection(socket);});

    httpServer.listen(self.port, function() {
        console.log("Web socket server listening on port " + self.port);
        callback(null);
    });
};


WebSocketViewerServer.prototype.onConnection = function(socket) {
    var viewer = new WebSocketViewer(socket);
    this.emit("new_viewer", viewer);
};


