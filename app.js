var PORT = 1337;

var http = require('http');

var engine = require('engine.io');
var express = require('express');
var serveStatic = require('serve-static');
var bodyParser = require('body-parser');

var router = require('./lib/router');

// TODO replace express w/ static file server
var app = express()
.use(serveStatic('public'))
.use(bodyParser.json())
.post('/create', function(req, res) {
  var body = req.body;
  try {
    var data = router.create(body);
  } catch(err) {
    console.log('error creating draft', err);
    res.status(500);
    data = err.message;
  }
  res.send(data);
})
;

var httpServer = http.createServer(app);
engine.attach(httpServer).on('connection', router.connect);

httpServer.listen(PORT, function() {
  console.log('http://localhost:%d', PORT);
});
