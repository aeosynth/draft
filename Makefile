.PHONY: all install clean cards score js
all: install clean cards score js

node := ${CURDIR}/node_modules
all_sets := ${CURDIR}/data/AllSets.json
traceur := ${node}/.bin/traceur

${traceur}: install

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
	rm -f ${all_sets}

cards: ${all_sets}
	node src/make cards

custom:
	node src/make custom

${all_sets}:
	curl -so ${all_sets} https://mtgjson.com/json/AllSets.json

score:
	-node src/make score #ignore errors

js: ${traceur} ${all_sets}
	${traceur} --out public/lib/app.js public/src/init.js

run: js
	node run
