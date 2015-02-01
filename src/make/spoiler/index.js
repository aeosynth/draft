var fs = require('fs')
var fetch = require('node-fetch')
var {Cards, Sets} = require('../../data')
var mtgs = require('./mtgs')
var wiz = require('./wiz')

var code = 'FRF'

var imagesURL = 'http://magic.wizards.com/en/articles/archive/frf-cig-en'
var cardsURL = 'http://www.mtgsalvation.com/spoilers/146-fate-reforged'

function ok(res) {
  if (res.ok)
    return res.text()
  throw Error('not ok')
}

let promises = [
  fetch(imagesURL).then(ok),
  fetch(cardsURL).then(ok)
]

Promise
  .all(promises)
  .then(go)
  .catch(console.log)

var set = Sets[code] = {
  common: [],
  uncommon: [],
  rare: [],
  mythic: [],
  special: [],
  size: 10
}

function go(values) {
  var images = wiz(values[0])
  var cards = mtgs(values[1], images, code)

  for (var name in cards) {
    var card = cards[name]
    var lc = name.toLowerCase()

    var {rarity} = card.sets[code]
    set[rarity].push(lc)

    if (lc in Cards)
      Cards[lc].sets[code] = card.sets[code]
    else
      Cards[lc] = card
  }

  if (!set.special.length)
    delete set.special

  fs.writeFileSync('data/cards.json', JSON.stringify(Cards, null, 2))
  fs.writeFileSync('data/sets.json' , JSON.stringify(Sets , null, 2))
}
