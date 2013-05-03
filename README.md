# draft

this project is a draft simulator client / server for the card game
[magic: the gathering](http://en.wikipedia.org/wiki/Magic:_The_Gathering)

this project is unafilliated with wizards of the coast

# run

install [nodejs](http://nodejs.org), then install dependencies with

    npm install && npm install -g coco

build the js with

    coco -bco lib src

build the card database with

    node lib/scrape/scrape.js

actually run the server with

    node app.js

open <http://localhost:1337> to connect

# hack

this project is written in [coco](https://github.com/satyr/coco), which
transpiles to javascript

draft results are stored in
[iriscouch](https://aeosynth.iriscouch.com:6984/_utils/)

to store results in your own couch, create `data/couch.json` with your
credentials
