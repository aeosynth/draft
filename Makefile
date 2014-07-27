all: install js cards bots

install:
	npm install
	mkdir -p public/js
	ln -s ${PWD}/node_modules/normalize.css/normalize.css public/css
	ln -s ${PWD}/node_modules/react/dist/react.js public/js
	ln -s ${PWD}/node_modules/engine.io-client/engine.io.js public/js

js:
	node_modules/.bin/coco -bco lib src
	node_modules/.bin/gulp build

cards:
	node lib/generate/cards.js

bots:
	node lib/db/score.js

spoiler:
	node lib/generate/spoiler
