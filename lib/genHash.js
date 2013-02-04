var crypto = require('crypto');

var opts = {
  cod: {
    prefix: 'SB:',
    cardTransform: function(card) {
      return card.toLowerCase();
    },
    separator: ';',
    hash: 'sha1',
    digestTransform: function(digest) {
      return parseInt(digest.slice(0, 10), 16).toString(32);
    }
  },
  dec: {
    prefix: '#',
    cardTransform: function(card) {
      return card.toUpperCase().replace(/[^A-Z]/g, '');
    },
    separator: '',
    hash: 'md5',
    digestTransform: function(digest) {
      return digest.slice(0, 8);
    }
  }
};

function hash(deck, options) {
  var cardList = [];
  for (var zone in deck) {
    var prefix = zone === 'side' ? options.prefix : ''
      , cards = deck[zone]
      , n
      , s
      ;
    for (var card in cards) {
      n = cards[card];
      s = prefix + options.cardTransform(card);
      while (n--)
        cardList.push(s);
    }
  }
  var data = cardList.sort().join(options.separator)
    , hash = crypto.createHash(options.hash).update(data, 'utf8')
    , digest = hash.digest('hex')
    ;
  return options.digestTransform(digest);
}

function genHash(deck) {
  return {
    cod: hash(deck, opts.cod),
    dec: hash(deck, opts.dec)
  };
}

module.exports = genHash;
