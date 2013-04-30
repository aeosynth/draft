var PORT = 1337;

var http = require('http');
var express = require('express');
var engine = require('engine.io');
var router = require('./lib/router');
var genDeck = require('./lib/generate/deck');

// TODO replace express w/ static file server
var app = express()
.use(express.static(__dirname + '/public'))
.use(express.bodyParser())
.post('/create', function(req, res) {
  var id = router.create(req.body);
  res.send(id);
})
.get('/q/:qid', function(req, res) {
  res.sendfile(__dirname + '/public/index.html');
})
.post('/deck', function(req, res) {
  var body = req.body;
  var deck = JSON.parse(body.deck);
  var type = body.type;
  deck = genDeck(deck, type);
  res.attachment('draft.' + type);
  res.send(deck);
})
;

var httpServer = http.createServer(app);

engine.attach(httpServer).on('connection', router.connect);

httpServer.listen(PORT, function() {
  console.log('http://localhost:%d', PORT);
});
