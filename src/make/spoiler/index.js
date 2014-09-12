var fs = require('fs')
var ask = require('ask')
var {Cards, Sets} = require('../../data')
var mtgs = require('./mtgs')
var wiz = require('./wiz')

var code = 'KTK'

var imagesURL = 'http://magic.wizards.com/en/articles/archive/ktk-cig-en'
var cardsURL = 'http://www.mtgsalvation.com/spoilers/144-khans-of-tarkir'

ask(imagesURL, (err, html) => {
  if (err)
    throw err
  var images = wiz(html)

  var opts = {
    url: cardsURL,
    headers: { 'User-Agent': 'curl' } // WTF
  }
  ask(opts, (err, html) => {
    if (err)
      throw err
    var cards = mtgs(html, images, code)
    go(cards)
  })
})

var set = Sets[code] = {
  common: [],
  uncommon: [],
  rare: [],
  mythic: [],
  special: [],
  size: 10
}

function go(cards) {
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
