var crypto = require('crypto');

function genHash(deck) {
  var cardList = [];
  for (var zone in deck) {
    var prefix = zone === 'side' ? 'SB:' : ''
    , cards = deck[zone]
    ;
    for (var card in cards) {
      var n = cards[card];
      while (n--)
        cardList.push(prefix + card.toLowerCase());
    }
  }
  var data = cardList.sort().join(';')
  , hash = crypto.createHash('sha1').update(data, 'utf8')
  , digest = hash.digest('hex')
  ;
  return parseInt(digest.slice(0, 10), 16).toString(32);
}

module.exports = genHash;
