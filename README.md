# draft

this project is a draft simulator client / server for the card game
[magic: the gathering](http://en.wikipedia.org/wiki/Magic:_The_Gathering)

this project is unafilliated with wizards of the coast

# run

install [nodejs](http://nodejs.org), then install dependencies with

    npm install

build the card database with

    node cards/scrape.js

actually run the server with

    ./app.js

open <http://localhost:1337> to connect

# hack

this project uses

- [engine.io](https://github.com/LearnBoost/engine.io) for realtime communication

- [angularjs](http://angularjs.org/) for data binding
