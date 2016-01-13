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

  const {name} = rawCard
  const lc = name.toLowerCase()
  set[rarity].push(lc)

  const sets = {[code]: { rarity, url: rawCard.url }}
  if (Cards[lc])
    return Cards[lc].sets[code] = sets[code]

  const {cid} = rawCard
  const color
    = cid.length === 1 ? COLORS[cid[0]]
    : !cid.length ? 'colorless'
    : 'multicolor'

  Cards[lc] = {
    cmc: rawCard.cmc,
    color,
    name,
    type: rawCard.type.split(' ')[0],
    sets
  }
})

//XXX ideally this would be done when generating the set, but that generator
//keys by name
if (code === 'OGW')
  set.common.push('wastes')

fs.writeFileSync('data/cards.json', JSON.stringify(Cards, null, 2))
fs.writeFileSync('data/sets.json', JSON.stringify(Sets, null, 2))
