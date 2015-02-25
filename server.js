var _ = require('lodash'),
    net = require('net'),
    http = require('http'),
    socketIO = require('socket.io'),
    GameConnection = require('./lib/game-connection'),
    GameCoordinator = require('./lib/game-coordinator');


var HOST = '127.0.0.1';
var SOCKET_PORT = 6969;
var WEB_SOCKET_PORT = 3000;

var games = {}; // Global dictionary of available games {gameId: Game}
var latestGame = null;

var server = net.createServer();
server.listen(SOCKET_PORT, HOST, function() {
    console.log('Server listening on ' + server.address().address +':'+ server.address().port);
});


function appleListener(data) {
    sendToViewers("apple", data);}

function positionsListener(data) {
    sendToViewers("positions", data);}

function endListener() {
    sendToViewers("end");
}


function sendToViewers(messageType, data) {
    _.each(streamLatestWebSockets, function(webSocket) {
        webSocket.emit(messageType, data);
        console.log("WEB SOCKET. '" + messageType + "' sent to " + webSocket.id);
    });
}

server.on('connection', function(socket) {
    var gameConnection = new GameConnection(socket);
    var gameCoordinator = new GameCoordinator(gameConnection, games);

    gameCoordinator.on("game_create", function(game) {
        console.log("game_create");
        game.on("start", function(data) {
            console.log("game start");

            if(latestGame) {
                latestGame.removeListener("positions", positionsListener);
                latestGame.removeListener("end", endListener);
                console.log("Removed old positions listener");
            }

            latestGame = game;

            latestGame.on("positions", positionsListener);
            latestGame.on("apple", appleListener);
            latestGame.on("end", endListener);

            _.each(streamLatestWebSockets, function(webSocket) {
                webSocket.emit("start", data);
                console.log("WEB SOCKET. Start sent to " + webSocket.id);
            });

            console.log("Latest game: " + latestGame.id);
        });

    });
});




// HTTP socket.io server for GUI

var httpServer = http.createServer();
var io = socketIO(httpServer);
var streamLatestWebSockets = [];

io.on('connection', function(socket){
    console.log("WEB SOCKET CONNECTION");

    socket.on('stream_latest', function () {
        streamLatestWebSockets.push(socket);
        console.log("WEB SOCKET STREAM LATEST REQUEST. Viewers: " + streamLatestWebSockets.length);
    });

    socket.on('disconnect', function(){
        streamLatestWebSockets = _.without(_.findWhere(streamLatestWebSockets, {id: socket.id}));
        console.log("WEB SOCKET DISCONNECT. Viewers: " + streamLatestWebSockets.length);
    });
});
httpServer.listen(WEB_SOCKET_PORT, function() {
    console.log("Web socket server listening.");
});
