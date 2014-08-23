var Game = require('./game')
var Room = require('./room')
var Sock = require('./sock')
var botnet = require('./botnet')
var util = require('./util')

var rooms = {
  lobby: new Room
}

function create(opts) {
  try {
    util.game(opts)
  } catch(err) {
    return this.err(err.message)
  }

  var g = new Game(opts)
  rooms[g.id] = g
  g.once('kill', kill)

  botnet(g.id, (err, url) => {
    if (!err)
      return this.send('set', { url })
    console.log(err.message)
    this.send('route', 'q/' + g.id)
  })
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
}

module.exports = function (ws) {
  var sock = new Sock(ws)
  sock.on('join', join)
  sock.on('create', create)
}
