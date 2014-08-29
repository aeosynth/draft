all: install cards score js

live: export NODE_ENV=production
live: all

install:
	npm install
	ln -sf ${CURDIR}/node_modules/normalize.css/normalize.css public/out
	ln -sf ${CURDIR}/node_modules/react/dist/react.js public/out
	ln -sf ${CURDIR}/node_modules/engine.io-client/engine.io.js public/out

cards: data/raw.json
	node src/make cards

data/raw.json:
	curl -so data/raw.json http://mtgjson.com/json/AllSets.json

score:
	node src/make score

js:
	node_modules/.bin/traceur --modules=commonjs --dir public/src public/out

run: js
	node run
