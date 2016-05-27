let _ = require('./_')
let Bot = require('./bot')
let Human = require('./human')
let Pool = require('./pool')
let Room = require('./room')
let Sock = require('./sock')

let SECOND = 1000
let MINUTE = 1000 * 60
let HOUR   = 1000 * 60 * 60

let games = {}

;(function playerTimer() {
  for (var id in games) {
    var game = games[id]
    if (game.round < 1)
      continue
    for (var p of game.players)
      if (p.time && !--p.time)
        p.pickOnTimeout()
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

module.exports = class Game extends Room {
  constructor({id, seats, type, sets, cube}) {
    super()

    if (sets) {
      if (type != 'chaos') {
        Object.assign(this, {
          sets,
          title: sets.join(' / ')
        })
      }
      else {
        Object.assign(this, { title: 'CHAOS!'})
      }
    }
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

    console.log(`game ${id} created`)
    Game.broadcastGameInfo()
  }

  renew() {
    this.expires = Date.now() + HOUR
  }

  get isActive() {
    return this.players.some(x => x.isConnected && !x.isBot)
  }

  // The number of total games. This includes ones that have been long since
  // abandoned but not yet garbage-collected by the `renew` mechanism.
  static numGames() {
    return Object.keys(games).length
  }

  // The number of games which have a player still in them.
  static numActiveGames() {
    let count = 0
    for (let id of Object.keys(games)) {
      if (games[id].isActive)
        count++
    }
    return count
  }

  static broadcastGameInfo() {
    Sock.broadcast('set', {
      numGames: Game.numGames(),
      numActiveGames: Game.numActiveGames(),
    })
    console.log(`there are now ${Game.numGames()} games, ${Game.numActiveGames()} active`)
  }

  name(name, sock) {
    super(name, sock)
    sock.h.name = sock.name
    this.meta()
  }

  join(sock) {
    sock.on('exit', this.farewell.bind(this))
    for (var i = 0; i < this.players.length; i++) {
      var p = this.players[i]
      if (p.id === sock.id) {
        p.attach(sock)
        this.greet(p)
        this.meta()
        super(sock)
        return
      }
    }

    if (this.round)
      return sock.err('game started')

    super(sock)

    var h = new Human(sock)
    if (h.id === this.hostID) {
      h.isHost = true
      sock.once('start', this.start.bind(this))
      sock.on('kick', this.kick.bind(this))
    }
    h.on('meta', this.meta.bind(this))
    this.players.push(h)
    this.greet(h)
    this.meta()
  }

  kick(i) {
    let h = this.players[i]
    if (!h || h.isBot)
      return

    if (this.round)
      h.kick()
    else
      h.exit()

    h.err('you were kicked')
    h.kick()
  }

  greet(h) {
    h.isConnected = true
    h.send('set', {
      isHost: h.isHost,
      round: this.round,
      self: this.players.indexOf(h),
      title: this.title
    })
  }

  farewell(sock) {
    sock.h.isConnected = false
    this.meta()
  }

  exit(sock) {
    if (this.round)
      return

    sock.removeAllListeners('start')
    var index = this.players.indexOf(sock.h)
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
      packs: p.packs.length,
      isBot: p.isBot,
      isConnected: p.isConnected,
      isReadyToStart: p.isReadyToStart,
    }))
    for (var p of this.players)
      p.send('set', state)
    Game.broadcastGameInfo()
  }

  kill(msg) {
    if (this.round > -1)
      this.players.forEach(p => p.err(msg))

    delete games[this.id]
    console.log(`game ${this.id} destroyed`)
    Game.broadcastGameInfo()

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

  start([addBots, useTimer]) {
    var src = this.cube ? this.cube : this.sets
    var {players} = this
    var p

    if (!players.every(x => x.isReadyToStart))
      return

    this.renew()

    if (/sealed/.test(this.type)) {
      this.round = -1
      var pools = Pool(src, players.length, true)
      for (p of players) {
        p.pool = pools.pop()
        p.send('pool', p.pool)
        p.send('set', { round: -1 })
      }
      return
    }

    for (p of players)
      p.useTimer = useTimer

    console.log(`game ${this.id} started with ${this.players.length} players and ${this.seats} seats`)
    Game.broadcastGameInfo()
    if (addBots)
      while (players.length < this.seats)
        players.push(new Bot)
    _.shuffle(players)

    if (/chaos/.test(this.type))
      this.pool = Pool(src, players.length, true, true)
    else
      this.pool = Pool(src, players.length)

    players.forEach((p, i) => {
      p.on('pass', this.pass.bind(this, p))
      p.send('set', { self: i })
    })
    this.startRound()
  }
}
