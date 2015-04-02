var util = require('util'),
    EventEmitter = require('events').EventEmitter,
    http = require('http'),
    socketIO = require('socket.io'),
    common = require('./common'),
    WebSocketViewer = require('./web-socket-viewer');

module.exports = WebSocketViewerServer;

/**
 * Creates a new HTTP socket.io server for viewers.
 * Call start to begin listening.
 * @constructor
 * @extends EventEmitter
 */
function WebSocketViewerServer(port) {
    this.port = port;
    EventEmitter.call(this);
}

util.inherits(WebSocketViewerServer, EventEmitter);

/**
 * Callback used by start function.
 * @callback WebSocketViewer~startCallback
 * @param {string|null} err     Error string if an error occurred.
 */
/**
 * Starts listening for web socket connections.
 * @param {WebSocketViewer~startCallback} callback     Callback function.
 */
WebSocketViewerServer.prototype.start = function(callback) {
    var self = this;
    var httpServer = http.createServer();
    var io = socketIO(httpServer);

    io.on('connection', function(socket) {self._onConnection(socket);});

    httpServer.listen(self.port, function() {
        common.log("Web socket server listening on port " + self.port);
        callback(null);
    });
};

/**
 * Handles new web socket connections.
 * @param {Object} socket   Web socket handle.
 * @emits WebSocketViewerServer#new_viewer
 * @private
 */
WebSocketViewerServer.prototype._onConnection = function(socket) {
    var viewer = new WebSocketViewer(socket);
    this.emit("new_viewer", viewer);
};


/**
 * New viewer has joined.
 *
 * @event WebSocketViewerServer#new_viewer
 * @type {WebSocketViewer}
 */