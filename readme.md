#AI Nibbles Server

A game server for AI Nibbles game (clone of the classic Q-basic game).

**Note: The server is an early alpha version.**

## Requirements

* [Node.JS] (http://nodejs.org)

## Installation

    git clone https://github.com/MattiLehtinen/ai-nibbles-server.git
    cd ai-nibbles-server
    npm install

Don't mind if you get MSBUILD errors. There is an optional native compilation step with socket.io which require
Visual Studio to be installed on windows but it will work fine without.

## Running

* Run Server: `npm start`
* Start [user interface](#user-interface) to watch the game
* Join 2 bots to start the game

## Configuration

Currently you need to change configuration parameters on `app.js` file.

## User Interface

You can use [AI Nibbles Monitor] (https://github.com/MattiLehtinen/ai-nibbles-monitor) to watch games. 

## Sample AI Implementation

See [sample node.js AI implementation] (https://github.com/MattiLehtinen/ai-nibbles-sample).

## API

### Join or Create if no game exists

    {"msg":"join", "data": {
        "player": {
            "name": "Will Worm"
        }
    }}

    
If new game is created, server sends:

    {"msg":"create", "data":{"gameId": "442152"}


### Join existing game

    {"msg":"join", "data":{"gameId": "442152", "player": {"name": "Will Worm"}}}

Server sends for each player's join:

    {"msg":"join", "data":{"gameId": "442152", "player" {...}}}

### Game starts

Server sends:

    {"msg":"start", "data":{"players": [{name: "Will Worm"}, {"name": "Wesley Worm"}]}}

### Game update

    {"msg":"positions", "data":{...}}