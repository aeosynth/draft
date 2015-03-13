all: install clean cards score js spoiler

node := ${CURDIR}/node_modules

install:
	npm install
	mkdir -p public/lib
	ln -sf ${node}/normalize.css/normalize.css public/lib
	ln -sf ${node}/react/dist/react.js public/lib
	ln -sf ${node}/engine.io-client/engine.io.js public/lib
	ln -sf ${node}/traceur/bin/traceur.js public/lib
	ln -sf ${node}/traceur/bin/traceur-runtime.js public/lib
	ln -sf ${node}/ee/ee.js public/lib
	ln -sf ${node}/utils/utils.js public/lib

clean:
	rm -f data/AllSets.json

cards: data/AllSets.json
	node src/make cards

spoiler:
	node src/make spoiler

data/AllSets.json:
	curl -so data/AllSets.json http://mtgjson.com/json/AllSets.json

score:
	-node src/make score #ignore errors

js:
	node_modules/.bin/traceur --out public/lib/app.js public/src/init.js

run: js
	node run
