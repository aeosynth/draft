let fs = require('fs')
let fetch = require('node-fetch')
let {Cards, Sets} = require('../../data')
let mtgs = require('./mtgs')
let wiz = require('./wiz')

let code = 'ORI'

let imagesURL = 'http://magic.wizards.com/en/articles/archive/card-image-gallery/magicorigins'
let cardsURL = 'http://www.mtgsalvation.com/spoilers/149-magic-origins'

function modifySet(cards) {
  // transformed cards
  for (let name in cards)
    if (cards[name].type === 'Planeswalker')
      delete cards[name]
}

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

let set = Sets[code] = {
  common: [],
  uncommon: [],
  rare: [],
  mythic: [],
  special: [],
  size: 10
}

function go(values) {
  let images = wiz(values[0])
  let cards = mtgs(values[1], images, code)

  modifySet(cards)

  for (let name in cards) {
    let card = cards[name]
    let lc = name.toLowerCase()

    let {rarity} = card.sets[code]
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
