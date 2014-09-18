all: install clean cards score js

install:
	npm install
	ln -sf ${CURDIR}/node_modules/normalize.css/normalize.css public/out
	ln -sf ${CURDIR}/node_modules/react/dist/react.js public/out
	ln -sf ${CURDIR}/node_modules/engine.io-client/engine.io.js public/out

clean:
	rm -f data/AllSets.json

cards: data/AllSets.json
	node src/make cards

spoiler:
	node src/make spoiler

data/AllSets.json:
	curl -so data/AllSets.json http://mtgjson.com/json/AllSets.json

score:
	node src/make score

js:
	node_modules/.bin/traceur --modules=commonjs --dir public/src public/out

run: js
	node run
