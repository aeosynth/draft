var {EventEmitter} = require('events')
var _ = require('./_')
var Bot = require('./bot')
var Human = require('./human')
var Pool = require('./pool')

var SECOND = 1000
var MINUTE = 1000 * 60
var HOUR   = 1000 * 60 * 60

var games = {}

;(function playerTimer() {
  for (var id in games) {
    var game = games[id]
    if (!game.round)
      continue
    for (var p of game.players)
      if (p.time && !--p.time)
        p.pickRand()
  }
  setTimeout(playerTimer, SECOND)
})()

;(function gameTimer() {
  var now = Date.now()
  for (var id in games)
    if (games[id].expires < now)
      games[id].kill('game over')

  setTimeout(gameTimer, MINUTE)
})()

module.exports = class Game extends EventEmitter {
  constructor({id, seats, type, sets, cube}) {
    if (sets)
      Object.assign(this, { sets,
        title: sets.join(' / ')})
    else {
      var title = type
      if (type === 'cube draft')
        title += ' ' + cube.packs + 'x' + cube.cards
      Object.assign(this, { cube, title })
    }

    var gameID = _.id()
    Object.assign(this, { seats, type,
      delta: -1,
      hostID: id,
      id: gameID,
      players: [],
      round: 0,
      rounds: cube ? cube.packs : 3
    })
    this.renew()
    games[gameID] = this
  }

  renew() {
    this.expires = Date.now() + HOUR
  }

  join(sock) {
    for (var i = 0; i < this.players.length; i++) {
      var p = this.players[i]
      if (p.id === sock.id) {
        p.attach(sock)
        this.greet(p)
        this.meta()
        return
      }
    }

    if (this.round)
      return sock.err('game started')

    var h = new Human(sock)
    if (h.id === this.hostID) {
      h.isHost = true
      sock.once('start', this.start.bind(this))
    }
    sock.once('exit', this.exit.bind(this, h))
    h.on('meta', this.meta.bind(this))
    this.players.push(h)
    this.greet(h)
    this.meta()
  }

  greet(h) {
    h.send('set', {
      isHost: h.isHost,
      round: this.round,
      self: this.players.indexOf(h),
      title: this.title
    })
  }

  exit(h) {
    if (this.round)
      return

    h.sock.removeAllListeners('start')
    var index = this.players.indexOf(h)
    this.players.splice(index, 1)

    this.players.forEach((p, i) =>
      p.send('set', { self: i }))
    this.meta()
  }

  meta(state={}) {
    state.players = this.players.map(p => ({
      hash: p.hash,
      name: p.name,
      time: p.time,
      packs: p.packs.length
    }))
    for (var p of this.players)
      p.send('set', state)
  }

  kill(msg) {
    this.players.forEach(p => p.send('error', msg))
    delete games[this.id]
    this.emit('kill')
  }

  end() {
    this.renew()
    this.round = -1
    this.meta({ round: -1 })
  }

  pass(p, pack) {
    if (!pack.length) {
      if (!--this.packCount)
        this.startRound()
      else
        this.meta()
      return
    }

    var index = this.players.indexOf(p) + this.delta
    var p2 = _.at(this.players, index)
    p2.getPack(pack)
    if (!p2.isBot)
      this.meta()
  }

  startRound() {
    if (this.round++ === this.rounds)
      return this.end()

    var {players} = this
    this.packCount = players.length
    this.delta *= -1

    for (var p of players)
      if (!p.isBot)
        p.getPack(this.pool.pop())

    //let the bots play
    this.meta = ()=>{}
    var index = players.findIndex(p => !p.isBot)
    var count = players.length
    while (--count) {
      index -= this.delta
      p = _.at(players, index)
      if (p.isBot)
        p.getPack(this.pool.pop())
    }
    this.meta = Game.prototype.meta
    this.meta({ round: this.round })
  }

  hash(h, deck) {
    h.hash = hash(deck)
    this.meta()
  }

  start(addBots) {
    var src = this.cube ? this.cube : this.sets
    var {players} = this
    var p

    this.renew()

    if (/sealed/.test(this.type)) {
      this.round = -1
      var pools = Pool(src, players.length, true)
      for (p of players) {
        p.pool = pools.pop()
        p.send('set', {
          pool: p.pool,
          round: -1
        })
      }
      return
    }

    if (addBots)
      while (players.length < this.seats)
        players.push(new Bot)
    _.shuffle(players)

    this.pool = Pool(src, players.length)
    players.forEach((p, i) => {
      p.on('pass', this.pass.bind(this, p))
      p.send('set', { self: i })
    })
    this.startRound()
  }
}