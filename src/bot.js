var {EventEmitter} = require('events')

module.exports = class extends EventEmitter {
  constructor() {
    Object.assign(this, {
      isBot: true,
      name: 'dr4ft bot',
      packs: [],
      time: 0
    })
  }
  getPack(pack) {
    var score = 99
    var index = 0
    var cardcount = 0
    var scoredcards = 0
    pack.forEach((card, i) => {
      if (card.score) {
        //if there's a better card in the pack, save the index of that card
        if (card.score < score) {
          score = card.score
          index = i
        }
      //keep track of the # of cards with scores
      scoredcards = scoredcards + 1
      }
      //track the number of cards in the pack
      cardcount = i
    })
    //if 50% of cards doesn't have a score, we're going to pick randomly
    if (scoredcards / cardcount < .5) {
      var randpick = _.rand(cardcount)
      pack.splice(randpick, 1)
    }
    else {
      pack.splice(index, 1)
    }
    this.emit('pass', pack)
  }
  send(){}
  err(){}
}
