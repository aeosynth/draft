const fs = require('fs')

const Cards = require('../../data/cards')
const Sets = require('../../data/sets')
const {code, cards, size} = require('../../data/custom')

if (Sets[code]) {
  console.log('already processed, exiting')
  process.exit()
}

const COLORS = {
  W: 'white',
  U: 'blue',
  B: 'black',
  R: 'red',
  G: 'green'
}

const set = Sets[code] = {
  common: [],
  uncommon: [],
  rare: [],
  mythic: [],
  size: size || 10
}

cards.forEach(rawCard => {
  const rarity = rawCard.rarity.split(' ')[0].toLowerCase()
  if (rarity === 'basic')
    return

  const name = rawCard.name.toLowerCase()
  set[rarity].push(name)

  const sets = {[code]: { rarity, url: rawCard.url }}
  if (Cards[name])
    return Cards[name].sets[code] = sets[code]

  const {colors} = rawCard
  const color
    = colors.length === 1 ? COLORS[colors[0]]
    : !colors.length ? 'colorless'
    : 'multicolor'

  Cards[name] = {
    cmc: rawCard.cmc,
    color,
    name,
    type: rawCard.type.split(' ')[0],
    sets
  }
})

fs.writeFileSync('data/cards.json', JSON.stringify(Cards, null, 2))
fs.writeFileSync('data/sets.json', JSON.stringify(Sets, null, 2))
