try {
  var Cards = require('../data/cards')
  var Sets = require('../data/sets')
} catch(err) {
  Cards = {}
  Sets = {}
}

module.exports = { Cards, Sets,
  ads: require('../data/ads'),
  mws: require('../data/mws')
}
