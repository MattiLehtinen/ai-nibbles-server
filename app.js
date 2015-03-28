var GameServer = require("./lib/game-server.js");

var HOST = undefined; // Accept connections to any IPv4 address
var SOCKET_PORT = 6969;
var WEB_SOCKET_PORT = 3000;

var gameServer = new GameServer(HOST, SOCKET_PORT, WEB_SOCKET_PORT);
gameServer.start(function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("Game server fully started.");
});
