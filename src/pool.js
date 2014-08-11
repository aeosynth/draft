var _ = require('./_')
var {Cards, Sets} = require('./data')

function selectRarity(set) {
  //fibonacci, because why not
  var n = _.rand(10)
  if (n < 1)
    return set.mythic
  if (n < 3)
    return set.rare
  if (n < 6)
    return set.uncommon
  return set.common
}

function toPack(code) {
  var set = Sets[code]
  var {common, uncommon, rare, mythic, special, size} = set
  if (mythic && _.rand(8))
    rare = mythic

  var pack = [].concat(
    _.choose(size, common),
    _.choose(3, uncommon),
    _.choose(1, rare)
  )

  switch (code) {
  case 'DGM':
    special = _.rand(20)
      ? special.gate
      : special.shock
    break
  case 'MMA':
    special = selectRarity(set)
    break
  case 'VMA':
    //http://www.wizards.com/magic/magazine/article.aspx?x=mtg/daily/arcana/1491
    if (_.rand(53))
      special = selectRarity(set)
    break
  }

  if (special)
    pack.push(_.choose(1, special))

  return toCards(pack, code)
}

function toCards(pool, code) {
  var isCube = !code
  return pool.map(cardName => {
    var card = Object.assign({}, Cards[cardName])

    var {sets} = card
    if (isCube)
      [code] = Object.keys(sets)
    card.code = code

    var set = sets[code]
    delete card.sets
    return Object.assign(card, set)
  })
}

module.exports = function (src, playerCount, isSealed) {
  if (!(src instanceof Array)) {
    var isCube = true
    _.shuffle(src.list)
  }
  if (isSealed) {
    var count = playerCount
    var size = 90
  } else {
    count = playerCount * src.packs
    size = src.cards
  }
  var pools = []

  if (isCube || isSealed)
    while (count--)
      pools.push(isCube
        ? toCards(src.list.splice(-size))
        : [].concat(...src.map(toPack)))
  else
    for (var code of src)
      for (var i = 0; i < playerCount; i++)
        pools.push(toPack(code))

  return pools
}
