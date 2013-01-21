var _ = require('underscore')
  , Data = require('../cards/data')
  ;

function rand(arr, num) {
  if (num)
    return _.shuffle(arr).slice(0, num);
  return arr[_.random(arr.length - 1)];
}

function genPack(set) {
  set = Data[set];
  var lands = set.Land
    , commons = set.Common
    , uncommons = set.Uncommon
    , rares = set.Rare
    , mythics = set['Mythic Rare']
    , pack = { id: _.random(1e8), cards: [] }
    , cards = pack.cards
    ;
  //cards.push(rand(lands));
  cards.push.apply(cards, rand(commons, 10));
  cards.push.apply(cards, rand(uncommons, 3));
  if (_.random(7))
    cards.push(rand(rares));
  else
    cards.push(rand(mythics));
  return pack;
}

module.exports = genPack;
