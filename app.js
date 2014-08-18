var PORT = 1337
var http = require('http')
var serve = require('serve')
var eio = require('engine.io')
var traceur = require('traceur')

traceur.require.makeDefault()
var router = require('./src/router')

var server = http.createServer(serve('public')).listen(PORT)
var eioServer = eio(server).on('connection', router)

var HOUR_S = 60 * 60 // hour in seconds

console.log('listening on port', PORT)

;(function log() {
  var now = (new Date).toUTCString()
  var up = Math.floor(process.uptime() / HOUR_S)
  var mem = process.memoryUsage()
  var count = eioServer.clientsCount

  for (var key in mem)
    mem[key] = (mem[key] / 1e6).toFixed(2)

  console.log('[%s]', now, up, count, mem.rss, mem.heapTotal, mem.heapUsed)

  setTimeout(log, 1000 * HOUR_S)
})()
