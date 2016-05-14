var {EventEmitter} = require('events')

module.exports = class extends EventEmitter {
  constructor() {
    Object.assign(this, {
      isBot: true,
      isConnected: true,
      name: 'bot',
      packs: [],
      time: 0,
    })
  }
  getPack(pack) {
    var score = 99
    var index = 0
    pack.forEach((card, i) => {
      if (card.score < score) {
        score = card.score
        index = i
      }})
    pack.splice(index, 1)
    this.emit('pass', pack)
  }
  send(){}
  err(){}
}
