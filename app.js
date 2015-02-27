var GameServer = require("./lib/game-server.js");

var HOST = '127.0.0.1';
var SOCKET_PORT = 6969;
var WEB_SOCKET_PORT = 3000;

var gameServer = new GameServer(HOST, SOCKET_PORT, WEB_SOCKET_PORT);
gameServer.start(function(err) {
    console.log("Game server fully started.");
});
