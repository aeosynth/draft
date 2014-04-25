var PORT = 1337;

var http = require('http');
var express = require('express');
var sockjs = require('sockjs');
var router = require('./lib/router');

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
.get('/help', function(req, res) {
  res.sendfile(__dirname + '/public/index.html');
})
.get('/err/:err', function(req, res) {
  res.sendfile(__dirname + '/public/index.html');
})
;

var httpServer = http.createServer(app);
sockjs.createServer()
  .on('connection', router.connect)
  .installHandlers(httpServer, {
    prefix: '/sock',
    log: function(){}
  })
  ;

httpServer.listen(PORT, function() {
  console.log('http://localhost:%d', PORT);
});
