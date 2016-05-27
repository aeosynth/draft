var _ = require('./_')
var {Cards, Sets, mws} = require('./data')

function selectRarity(set) {
  // average pack contains:
  // 14 cards
  // 10 commons
  // 3 uncommons
  // 7/8 rare
  // 1/8 mythic
  // * 8 -> 112/80/24/7/1

  let n = _.rand(112)
  if (n < 1)
    return set.mythic
  if (n < 8)
    return set.rare
  if (n < 32)
    return set.uncommon
  return set.common
}

function toPack(code) {
  var set = Sets[code]
  var {common, uncommon, rare, mythic, special, size} = set
  if (mythic && !_.rand(8))
    rare = mythic
  //make small sets draftable. SOI has 9 commons, none have less except early sets
  if (size < 10 && code != 'SOI')
    size = 10
  var pack = [].concat(
    _.choose(size, common),
    _.choose(3, uncommon),
    _.choose(1, rare)
  )

  if (code == 'SOI')
  //http://markrosewater.tumblr.com/post/141794840953/if-the-as-fan-of-double-face-cards-is-1125-that
    if (_.rand(8) == 0)
      if (_.rand(15) < 3)
        pack.push(_.choose(1, special.mythic))
      else
        pack.push(_.choose(1, special.rare))
    else
      pack.push(_.choose(1, common))

  let specialrnd
  switch (code) {
  case 'SOI':
    if (_.rand(106) < 38)
      special = special.uncommon
    else
      special = special.common
    break
  case 'DGM':
    special = _.rand(20)
      ? special.gate
      : special.shock
    break
  case 'MMA':
    special = selectRarity(set)
    break
  case 'MM2':
    special = selectRarity(set)
    break
  case 'VMA':
    //http://www.wizards.com/magic/magazine/article.aspx?x=mtg/daily/arcana/1491
    if (_.rand(53))
      special = selectRarity(set)
    break
  case 'FRF':
    special = _.rand(20)
      ? special.common
      : special.fetch
    break
  case 'ISD':
  //http://www.mtgsalvation.com/forums/magic-fundamentals/magic-general/327956-innistrad-block-transforming-card-pack-odds?comment=4
  //121 card sheet, 1 mythic, 12 rare (13), 42 uncommon (55), 66 common
    specialrnd = _.rand(121)
    if (specialrnd == 0)
      special = special.mythic
    else if (specialrnd < 13)
      special = special.rare
    else if (specialrnd < 55)
      special = special.uncommon
    else
      special = special.common
    break
  case 'DKA':
  //http://www.mtgsalvation.com/forums/magic-fundamentals/magic-general/327956-innistrad-block-transforming-card-pack-odds?comment=4
  //80 card sheet, 2 mythic, 6 rare (8), 24 uncommon (32), 48 common
    specialrnd = _.rand(80)
    if (specialrnd < 2)
      special = special.mythic
    else if (specialrnd < 8)
      special = special.rare
    else if (specialrnd < 32)
      special = special.uncommon
    else
      special = special.common
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
    card.code = mws[code] || code
    var set = sets[code]
    delete card.sets
    return Object.assign(card, set)
  })
}

module.exports = function (src, playerCount, isSealed, isChaos) {
  if (!(src instanceof Array)) {
    if (!(isChaos)) {
      var isCube = true
      _.shuffle(src.list)
    }
  }
  else {
    for (i = 0; i < src.length; i++) {
      if (src[i] == 'RNG') {
        var rnglist = []
        for (var rngcode in Sets)
          //TODO check this against public/src/data.js
          if (rngcode != 'UNH' && rngcode != 'UGL')
            rnglist.push(rngcode)
        var rngindex = _.rand(rnglist.length)
        src[i] = rnglist[rngindex]
      }
    }
  }
  if (isSealed) {
    var count = playerCount
    var size = 90
  } else {
    count = playerCount * src.packs
    size = src.cards
  }
  var pools = []

  if (isCube || isSealed) {
    if (!(isChaos)) {
      while (count--)
        pools.push(isCube
            ? toCards(src.list.splice(-size))
            : [].concat(...src.map(toPack)))
    } else {
      var setlist = []
      for (var code in Sets)
        if (code != 'UNH' && code != 'UGL')
          setlist.push(code)
      for (var i = 0; i < 3; i++) {
        for (var j = 0; j < playerCount; j++) {
          var setindex = _.rand(setlist.length)
          var code = setlist[setindex]
          setlist.splice(setindex, 1)
          pools.push(toPack(code))
        }
      }
    }
  } else {
    for (var code of src.reverse())
      for (var i = 0; i < playerCount; i++)
        pools.push(toPack(code))
  }
  return pools
}
