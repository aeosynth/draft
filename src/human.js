var {EventEmitter} = require('events')
var _ = require('./_')
var util = require('./util')
var hash = require('./hash')

module.exports = class extends EventEmitter {
  constructor(sock) {
    Object.assign(this, {
      id: sock.id,
      name: sock.name,
      time: 0,
      packs: [],
      pool: []
    })
    this.attach(sock)
  }
  attach(sock) {
    if (this.sock)
      this.sock.ws.close()

    sock.mixin(this)
    sock.on('name', this._name.bind(this))
    sock.on('pick', this._pick.bind(this))
    if (!this.hash)
      sock.once('hash', this._hash.bind(this))
    this.send('set', {
      pack: this.packs[0] || [],
      pool: this.pool
    })
  }
  _hash(deck) {
    if (!util.deck(deck, this.pool))
      return

    this.hash = hash(deck)
    this.emit('meta')
  }
  _name(name) {
    if (typeof name !== 'string')
      return
    this.name = this.sock.name = name.slice(0, 15)
    this.emit('meta')
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
      return this.pick(0, true)

    this.time = 20 + 5 * pack.length
    this.send('set', { pack })
  }
  pick(index, isJunk) {
    var pack = this.packs.shift()
    var card = pack.splice(index, 1)[0]

    this.pool.push(card)
    this.send('add', [card, isJunk])

    var [next] = this.packs
    if (!next)
      this.time = 0
    else
      this.sendPack(next)

    this.emit('pass', pack)
  }
  pickRand() {
    var index = _.rand(this.packs[0].length)
    this.pick(index, true)
  }
  kick() {
    this.send = ()=>{}
    while(this.packs.length)
      this.pickRand()
    this.sendPack = this.pickRand
    this.isBot = true
  }
}
