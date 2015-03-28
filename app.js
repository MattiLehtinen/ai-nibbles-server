var GameServer = require("./lib/game-server.js");

var HOST = undefined; // Accept connections to any IPv4 address
var GAME_SERVER_SOCKET_PORT = 6969;
var VIEWER_SERVER_WEB_SOCKET_PORT = 3000;

var gameServer = new GameServer(HOST, GAME_SERVER_SOCKET_PORT, VIEWER_SERVER_WEB_SOCKET_PORT);
gameServer.start(function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("Game server fully started.");
});
