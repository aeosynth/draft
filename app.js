var PORT = 1337
var http = require('http')
var eio = require('engine.io')
var send = require('send')
var traceur = require('traceur')

traceur.require.makeDefault(function(path) {
  return path.indexOf('node_modules') === -1
})
var router = require('./src/router')

var server = http.createServer(function(req, res) {
  send(req, req.url, { root: 'public' }).pipe(res)
}).listen(PORT)
var eioServer = eio(server).on('connection', router)

var HOUR_S = 60 * 60 // hour in seconds

console.log('listening on port', PORT)

;(function log() {
  var now = (new Date).toUTCString()
  var up = Math.floor(process.uptime() / HOUR_S)
  var mem = process.memoryUsage()
  var count = eioServer.clientsCount

  for (var key in mem)
    mem[key] = Math.round(mem[key] / 1e6)

  console.log('[%s]\t%d\t%d\t%d\t%d\t%d',
    now, up, count, mem.rss, mem.heapTotal, mem.heapUsed)

  setTimeout(log, 1000 * HOUR_S)
})()
