var PORT = 80
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

console.log(new Date)
