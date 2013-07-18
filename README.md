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

actually run the server:

    node app.js

open <http://localhost:1337> to connect

# relax

to save draft results, enabling smarter bots, set up a couch:

- install [couchdb]

- start the server

- create an admin

- create two databases: `cube`, `draft`

- add validation functions to the databases; see `couch/validate_doc_update.js`

- add views: use `couch/map.js` to map, and `_stats` to reduce

- copy `couch/couch.json` into `data/couch.json`, with your credentials

for more details, see the couchdb [guide], especially the chapters on
[validation] and [security]

build card scores (may take a while):

    node lib/db/score.js

[couchdb]: http://couchdb.apache.org/
[guide]: http://guide.couchdb.org/draft/index.html
[validation]: http://guide.couchdb.org/draft/validation.html
[security]: http://guide.couchdb.org/draft/security.html

# deploy

[iriscouch](http://www.iriscouch.com/) provides free couchdb hosting

modify `public/index.html`:

- change the google analytics id to your own

- create your own [firebase](https://www.firebase.com/) (free),
  then update the firebase url (firebase may be removed in the future, see
  [#37](https://github.com/aeosynth/draft/issues/37))

- use the commented out, cdn hosted versions of normalize.css and angular.js

# hack

this project is written in [coco](https://github.com/satyr/coco), which
transpiles to javascript
