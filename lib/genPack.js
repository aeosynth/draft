var _ = require('underscore')
  , Cards = require('../cards/cards')
  , Sets  = require('../cards/sets')
  , rarity =
    { Common: 1
    , Uncommon: 2
    , Rare: 3
    , 'Mythic Rare': 4
    }
  ;

function rand(arr, num) {
  if (num)
    return _.shuffle(arr).slice(0, num);
  return arr[_.random(arr.length - 1)];
}

function getCardInfo(card) {
  card = Cards[card];
  var url = card.url;
  var id = card.id;
  if (id)
    url = "http://gatherer.wizards.com/Handlers/Image.ashx?type=card&multiverseid=" + id;

  return {
    cmc: card.cmc,
    color: card.color,
    name: card.name,
    rarity: rarity[card.rarity],
    url: url
  };
}

function genPack(set) {
  var pack = { id: _.random(1e8) };

  if (set === "Dragon's Maze") {
    set = _.shuffle(Sets[set].Common).splice(-14);
    pack.cards = _.map(set, getCardInfo);
    return pack;
  }

  if (typeof set === 'object') {
    pack.cards = _.map(set.splice(-15, 15), getCardInfo);
    return pack;
  }

  set = Sets[set];
  var commons = set.Common
    , uncommons = set.Uncommon
    , rares = set.Rare
    , mythics = set['Mythic Rare'] || rares
    , cards = []
    ;
  cards.push.apply(cards, rand(commons, 10));
  cards.push.apply(cards, rand(uncommons, 3));
  if (_.random(7))
    cards.push(rand(rares));
  else
    cards.push(rand(mythics));
  pack.cards = _.map(cards, getCardInfo);
  return pack;
}

module.exports = genPack;
