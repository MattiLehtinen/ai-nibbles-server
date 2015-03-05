#AI-Nibbles Server

A game server for AI-nibbles game (clone of the classic Q-basic game).

**Note: The server is an early alpha version.**

## Requirements

* [Node.JS] (http://nodejs.org)

## Installation

    git clone https://github.com/MattiLehtinen/ai-nibbles-server.git
    cd ai-nibbles-server
    npm install

## Running
    npm start

## API

### Join or Create if no game exists

    {"msg":"join", "data": {
        "player": {
            "name": "Will Worm"
        }
    }}

    
If new game is created, server sends:

    {"msg":"created", "data":{"gameId": "442152"}


### Join existing game

    {"msg":"join", "data":{"gameId": "442152", "player": {"name": "Will Worm"}}}

Server sends for each player's join:

    {"msg":"joined", "data":{"gameId": "442152", "player" {...}}}

### Game starts

Server sends:

    {"msg":"start", "data":{"players": [{name: "Will Worm"}, {"name": "Wesley Worm"}]}}

### Game update

    {"msg":"positions", "data":{...}}