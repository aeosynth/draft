try {
  var Cards = require('../data/cards')
  var Sets = require('../data/sets')
} catch(err) {
  Cards = {}
  Sets = {}
}

var mws = require('../data/mws')
for (var code in mws)
  Sets[mws[code]] = Sets[code]

module.exports = { Cards, Sets }
