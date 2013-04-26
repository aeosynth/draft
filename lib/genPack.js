var _ = require('underscore')
  , Cards = require('../cards/cards')
  , Sets  = require('../cards/sets')
  , rarity =
    { mythic: 1
    , rare: 2
    , uncommon: 3
    , common: 4
    }
  ;

function rand(arr, num) {
  if (num)
    return _.shuffle(arr).slice(0, num);
  return arr[_.random(arr.length - 1)];
}

function getCardInfo(card) {
  card = Cards[card];

  return {
    cmc: card.cmc,
    color: card.color,
    name: card.name,
    rarity: rarity[card.rarity],
    url: card.url
  };
}

function genPack(setName) {
  var pack = { id: _.random(1e8) };

  if (typeof setName === 'object') {
    pack.cards = _.map(setName.splice(-15, 15), getCardInfo);
    return pack;
  }

  set = Sets[setName];
  var commons = set.common
    , uncommons = set.uncommon
    , rares = set.rare
    , mythics = set.mythic
    , special = set.special
    , cards = []
    ;
  mythics.length || (mythics = rares);
  cards.push.apply(cards, rand(commons, 10));
  cards.push.apply(cards, rand(uncommons, 3));
  if (_.random(7))
    cards.push(rand(rares));
  else
    cards.push(rand(mythics));

  switch (setName) {
    case "Dragon's Maze":
      if (_.random(21))
        cards.push(rand(special.gate));
      else
        cards.push(rand(special.shock));
      break;
    case 'Time Spiral':
      cards.push(rand(special));
      break;
  }

  pack.cards = _.map(cards, getCardInfo);

  return pack;
}

module.exports = genPack;
