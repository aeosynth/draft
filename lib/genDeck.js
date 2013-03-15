var _ = require('underscore');

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
  if (!(deck && type && (type in types)))
    return false
  return types[type](deck.main, deck.side);
}

module.exports = genDeck;
