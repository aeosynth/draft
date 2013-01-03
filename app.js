#!/usr/bin/env node

var PORT = 1337
  , express = require('express')
  , app = express()
  , server = require('http').createServer(app)
  , WSS = require('ws').Server
  , wss = new WSS({ server: server })
  , router = require('./lib/router')
  , Q = require('./lib/q')
  ;

app
  .use(express.static(__dirname + '/public'))
  .use(express.urlencoded())
  ;

app.post('/create', function(req, res) {
  var q = new Q(req.body.set)
    , id = q.id
    ;
  router.routes[id] = q;
  res.redirect('/q.html#' + id);
});

wss.on('connection', router);

server.listen(PORT);

console.log('http://localhost:%d', PORT);
