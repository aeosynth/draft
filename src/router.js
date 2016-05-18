var Game = require('./game')
var Room = require('./room')
var Sock = require('./sock')
var util = require('./util')

var rooms = {
  lobby: new Room
}

// All sockets currently connected to the server, useful for broadcasting
// messages.
var socks = []

function broadcast(...args) {
  for (let sock of socks)
    sock.send(...args)
}

function numGames() {
  // Don't include the lobby as a game.
  return Object.keys(rooms).length - 1
}

function connect(sock) {
  socks.push(sock)
  printNumSockets()
  broadcast('numGames', numGames())

  sock.ws.once('close', ()=> {
    let index = socks.indexOf(sock)
    if (index !== -1) {
      socks.splice(index, 1)
      printNumSockets()
    }
  })
}

function create(opts) {
  try {
    util.game(opts)
  } catch(err) {
    return this.err(err.message)
  }

  opts.id = this.id
  var g = new Game(opts)
  rooms[g.id] = g
  this.send('route', 'g/' + g.id)
  g.once('kill', kill)
  broadcast('numGames', numGames())
  console.log(`game ${g.id} created, there are now ${numGames()} games`)
}

function join(roomID) {
  var room = rooms[roomID]
  if (!room)
    return this.err(`room ${roomID} not found`)
  this.exit()
  room.join(this)
}

function kill() {
  delete rooms[this.id]
  broadcast('numGames', numGames())
  console.log(`game ${this.id} destroyed, there are now ${numGames()} games`)
}

function printNumSockets() {
  console.log(`there are now ${socks.length} connected users`)
}

module.exports = function (ws) {
  var sock = new Sock(ws)
  sock.on('join', join)
  sock.on('create', create)
  connect(sock)
}
