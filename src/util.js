var assert = require('assert')
var _ = require('./_')
var {Cards, Sets} = require('./data')
var BASICS = [
  'Forest',
  'Island',
  'Mountain',
  'Plains',
  'Swamp'
]

function transform(cube) {
  var list = cube.list
    .map(x =>
      util.name(x.trim())
      .replace(/^(\d+.)?\s*/, '')
      .toLowerCase())
    .filter(x => x)

  var bad = []
  for (var cardName of list)
    if (!(cardName in Cards))
      bad.push(cardName)

  if (bad.length) {
    var err = `invalid cards: ${bad.splice(-10).join('; ')}`
    if (bad.length)
      err += `; and ${bad.length} more`
    throw Error(err)
  }

  cube.list = list
}

var util = module.exports = {
  name(s) {
    return s.replace(/[Æâàáéíöúû’]/g, c => {
      switch (c) {
      case 'Æ': return 'AE'
      case 'â': case 'à': case 'á': return 'a'
      case 'é': return 'e'
      case 'í': return 'i'
      case 'ö': return 'o'
      case 'ú': case 'û': return 'u'
      case '’': return "'"
      }
    })
  },
  deck(deck, pool) {
    pool = _.count(pool, 'name')

    for (var zoneName in deck) {
      var zone = deck[zoneName]
      for (var cardName in zone) {
        if (typeof zone[cardName] !== 'number')
          return
        if (BASICS.indexOf(cardName) > -1)
          continue
        if (!(cardName in pool))
          return
        pool[cardName] -= zone[cardName]
        if (pool[cardName] < 0)
          return
      }
    }

    return true
  },
  game({id, seats, type, sets, cube}) {
    assert(typeof id === 'string', 'typeof string')
    assert(typeof seats === 'number', 'typeof seats')
    assert(2 <= seats && seats <= 8, 'seats range')
    assert(['draft', 'sealed', 'cube draft', 'cube sealed'].indexOf(type) > -1,
      'indexOf type')

    if (!/cube/.test(type))
      return sets.forEach(set => assert(set in Sets, `${set} in Sets`))

    var {cards, packs} = cube
    assert(typeof cards === 'number', 'typeof cards')
    assert(8 <= cards && cards <= 15, 'cards range')
    assert(typeof packs === 'number', 'typeof packs')
    assert(3 <= packs && packs <= 5, 'packs range')
    transform(cube)
  }
}
