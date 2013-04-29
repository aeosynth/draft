var PORT = 1337;

var http = require('http');
var express = require('express');
var engine = require('engine.io');
var router = require('./lib/router');

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
;

var httpServer = http.createServer(app);

engine.attach(httpServer).on('connection', router.connect);

httpServer.listen(PORT, function() {
  console.log('http://localhost:%d', PORT);
});
