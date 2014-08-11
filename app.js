var PORT = 1337
var http = require('http')
var serve = require('serve')
var eio = require('engine.io')
var traceur = require('traceur')

traceur.require.makeDefault()
var router = require('./src/router')

var server = http.createServer(serve('public')).listen(PORT)
var eioServer = eio(server).on('connection', router)

console.log('[%s] port', (new Date).toUTCString(), PORT)

;(function log() {
  var up = process.uptime().toFixed(2)
  var mem = process.memoryUsage()
  var count = eioServer.clientsCount

  for (var key in mem)
    mem[key] = (mem[key] / 1e6).toFixed(2)

  console.log(up, count, mem)

  setTimeout(log, 1000 * 60 * 60)
})()
