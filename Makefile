all: install js cards bots

install:
	npm install

js:
	node_modules/coco/lib/command.js -bco lib src

cards:
	node lib/generate/cards.js

bots:
	node lib/db/score.js

spoiler:
	node lib/generate/spoiler.js ${WIZ} ${SAL}
