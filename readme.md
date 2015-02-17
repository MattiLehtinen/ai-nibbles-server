#AI Nibbles

## API

### Join or Create if no game exists

    {"msg":"join", "data": {
        "player": {
            "name": "Will Worm"
        }
    }}

### Create new game

    {"msg":"create", "data": {
        "player": {
            "name": "Will Worm"
        }
    }}
    
Server sends:

    {"msg":"created", "data":{"gameId": "442152"}


### Join existing game

    {"msg":"join", "data":{"gameId": "442152", "player": {"name": "Will Worm"}}}

Server sends:

    {"msg":"joined", "data":{"gameId": "442152", "player" {...}}}

### Game starts

Server sends:

    {"msg":"start", "data":{"players": [{name: "Will Worm"}, {"name": "Wesley Worm"}]}}

### Game update

    {"msg":"positions", "data":{...}}