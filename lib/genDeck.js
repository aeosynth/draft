var _ = require('underscore')
, crypto = require('crypto')
;

function generateHash(deck) {
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

var types = {
  cod: function(main, side) {
    // generating strings is easier then using a proper xml builder
    var mainXML = []
      , sideXML = []
      ;
    _.each(main, function(num, name) {
      mainXML.push('<card number="' + num + '" name="' + name + '"/>');
    });
    _.each(side, function(num, name) {
      sideXML.push('<card number="' + num + '" name="' + name + '"/>');
    });
    var xml =
      '<?xml version="1.0" encoding="UTF-8"?>' +
      '<cockatrice_deck version="1">' +
        '<deckname>draft</deckname>' +
        '<zone name="main">' +
          mainXML.join('') +
        '</zone>' +
        '<zone name="side">' +
          sideXML.join('') +
        '</zone>' +
      '</cockatrice_deck>'
      ;
    return xml;
  },
  dec: function(main, side) {
    var deck = [];
    _.each(main, function(num, name) {
      deck.push(num + ' ' + name);
    });
    _.each(side, function(num, name) {
      deck.push('SB: ' + num + ' ' + name);
    });
    return deck.join('\n');
  }
};

function genDeck(deck, type) {
  try {
    deck = JSON.parse(deck);
  } catch (err) {
    console.log(err);
    return false;
  }
  return types[type](deck.main, deck.side);
}

module.exports = genDeck;
