#!/usr/bin/env node

var PORT = 1337
  , express = require('express')
  , app = express()
  , server = require('http').createServer(app)
  , wss = require('./lib/ws')(server)
  , router = require('./lib/router')
  ;

app
  .use(express.static(__dirname + '/public'))
  .use(express.urlencoded())
  ;

app.post('/create', function(req, res) {
  var id = router.create(req.body.set);
  res.redirect('/q.html#' + id);
});

app.post('/deck', function(req, res) {
  var deck = req.body.deck;
  res.attachment('draft.dec');
  res.send(deck);
});

wss.on('connection', router);

server.listen(PORT);

console.log('http://localhost:%d', PORT);
