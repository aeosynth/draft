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
  var body = req.body;
  try {
    var id = router.create(body);
  } catch(err) {
    console.log('error creating draft', err);
    res.send(500, err.message);
    return;
  }
  res.send(id);
})
.get('/q/:qid', function(req, res) {
  res.sendfile(__dirname + '/public/index.html');
})
.get('/err/:err', function(req, res) {
  res.sendfile(__dirname + '/public/index.html');
})
.post('/deck', function(req, res) {
  var body = req.body;
  try {
    var deck = JSON.parse(body.deck);
    var ext = body.extension;
    deck = genDeck(deck, ext);
  } catch(err) {
    console.log('error creating deck', err);
    res.end();
    return;
  }
  res.attachment('draft.' + ext);
  res.send(deck);
})
;

var httpServer = http.createServer(app);

engine.attach(httpServer).on('connection', router.connect);

httpServer.listen(PORT, function() {
  console.log('http://localhost:%d', PORT);
});
