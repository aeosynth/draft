var {EventEmitter} = require('events')
var _ = require('./_')
var util = require('./util')
var hash = require('./hash')

module.exports = class extends EventEmitter {
  constructor(sock) {
    Object.assign(this, {
      isBot: false,
      isConnected: false,
      isReadyToStart: false,
      id: sock.id,
      name: sock.name,
      time: 0,
      packs: [],
      autopick_index: -1,
      pool: [],
    })
    this.attach(sock)
  }
  attach(sock) {
    if (this.sock && this.sock !== sock)
      this.sock.ws.close()

    sock.mixin(this)
    sock.on('readyToStart', this._readyToStart.bind(this))
    sock.on('autopick', this._autopick.bind(this))
    sock.on('pick', this._pick.bind(this))
    sock.on('hash', this._hash.bind(this))

    var [pack] = this.packs
    if (pack)
      this.send('pack', pack)
    this.send('pool', this.pool)
  }
  err(message) {
    this.send('error', message)
  }
  _hash(deck) {
    if (!util.deck(deck, this.pool))
      return

    this.hash = hash(deck)
    this.emit('meta')
  }
  _readyToStart(value) {
    this.isReadyToStart = value
    this.emit('meta')
  }
  _autopick(index) {
    var [pack] = this.packs
    if (pack && index < pack.length)
      this.autopick_index = index
  }
  _pick(index) {
    var [pack] = this.packs
    if (pack && index < pack.length)
      this.pick(index)
  }
  getPack(pack) {
    if (this.packs.push(pack) === 1)
      this.sendPack(pack)
  }
  sendPack(pack) {
    if (pack.length === 1)
      return this.pick(0)

    if (this.useTimer)
      this.time = 20 + 5 * pack.length

    this.send('pack', pack)
  }
  pick(index) {
    var pack = this.packs.shift()
    var card = pack.splice(index, 1)[0]

    this.pool.push(card)
    this.send('add', card.name)

    var [next] = this.packs
    if (!next)
      this.time = 0
    else
      this.sendPack(next)

    this.autopick_index = -1
    this.emit('pass', pack)
  }
  pickOnTimeout() {
    let index = this.autopick_index
    if (index === -1)
      index = _.rand(this.packs[0].length)
    this.pick(index)
  }
  kick() {
    this.send = ()=>{}
    while(this.packs.length)
      this.pickOnTimeout()
    this.sendPack = this.pickOnTimeout
    this.isBot = true
  }
}
