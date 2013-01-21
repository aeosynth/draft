var _ = require('underscore');

var types = {
  cod: function(main, side) {
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
  deck = JSON.parse(deck);
  return types[type](deck.main, deck.side);
}

module.exports = genDeck;
