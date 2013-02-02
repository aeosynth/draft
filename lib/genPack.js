var _ = require('underscore')
  , Cards = require('../cards/cards')
  , Sets  = require('../cards/sets')
  ;

function rand(arr, num) {
  if (num)
    return _.shuffle(arr).slice(0, num);
  return arr[_.random(arr.length - 1)];
}

function getCardInfo(card) {
  card = Cards[card];
  var cost = card.cost
    , colorless = parseInt(cost) || 0
    , colored = (cost.match(/[RGBUW]|\(.+?\)/g) || { length: 0 }).length
    , cmc = colorless + colored
    ;
  return {
    cmc: cmc,
    id: card.id,
    name: card.name
  };
}

function genPack(set) {
  set = Sets[set];
  var commons = set.Common
    , uncommons = set.Uncommon
    , rares = set.Rare
    , mythics = set['Mythic Rare']
    , pack = { id: _.random(1e8), cards: [] }
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
