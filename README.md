# draft

this project is a draft simulator client / server for the card game
[magic: the gathering](http://en.wikipedia.org/wiki/Magic:_The_Gathering)

this project is unafilliated with wizards of the coast

# run

install [nodejs](http://nodejs.org), then install dependencies:

    npm install && npm install -g coco

build the js:

    coco -bco lib src

build the card database:

    node lib/scrape/scrape.js

build card scores (used by bots, may take minutes):

    node lib/db/score.js

actually run the server:

    node app.js

open <http://localhost:1337> to connect

to send draft results to your [couch](http://couchdb.apache.org/),
create `data/couch.json`:

```json
{
  "auth": {
    "user": "USERNAME",
    "pass": "PASSWORD"
  },
  "origin": "PROTOCOL://HOSTNAME:PORT"
}
```

[iriscouch](http://www.iriscouch.com/) provides free hosting

# deploy

modify `public/index.html`:

- change the google analytics id to your own

- create your own [firebase](https://www.firebase.com/) (free),
  then update the firebase url (firebase may be removed in the future, see #37)

- use the commented out, cdn hosted versions of normalize.css and angular.js

# hack

this project is written in [coco](https://github.com/satyr/coco), which
transpiles to javascript
