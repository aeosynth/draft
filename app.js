#!/usr/bin/env node

var PORT = 1337
  , express = require('express')
  , app = express()
  , server = require('http').createServer(app)
  , wss = require('./lib/ws')(server)
  , router = require('./lib/router')
  , genDeck = require('./lib/genDeck')
  ;

app
  .use(express.static(__dirname + '/public'))
  .use(express.bodyParser())
  ;

app.get('/q/:qid', function(req, res) {
  res.sendfile(__dirname + '/public/index.html');
});

app.post('/create', function(req, res) {
  var body = req.body
    , id = router.create(body.sets, body.type, body.size, body.bots, body.cube)
    ;
  res.send({ id: id });
});

app.post('/deck', function(req, res) {
  var body = req.body
    , deck = body.deck
    , type = body.type
    ;
  deck = genDeck(deck, type);
  if (deck)
    res.attachment('draft.' + type);
  res.send(deck);
});

wss.on('connection', router);

server.listen(PORT);

console.log('http://localhost:%d', PORT);
