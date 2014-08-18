var fs = require('fs')
var _ = require('../_')
var util = require('../util')
var raw = require('../../data/raw')

var Cards = {}
var Sets = {}

before()

var types = ['core', 'expansion', 'commander', 'planechase', 'starter', 'un']
var codes = ['HHO', 'MMA', 'VMA', 'CNS']
for (var code in raw) {
  var set = raw[code]
  if (types.indexOf(set.type) > -1
    || codes.indexOf(code) > -1)
    doSet(set, code)
}

after()

fs.writeFileSync('data/cards.json', JSON.stringify(Cards, null, 2))
fs.writeFileSync('data/sets.json', JSON.stringify(Sets, null, 2))

function before() {
  raw.UGL.cards = raw.UGL.cards.filter(x => x.layout !== 'token')

  raw.TSP.cards = raw.TSP.cards.concat(raw.TSB.cards)
  delete raw.TSB

  raw.PLC.booster = Array(11).fill('common')
  raw.FUT.booster = Array(11).fill('common')

  var card
  for (card of raw.ISD.cards)
    if (card.layout === 'double-faced')
      card.rarity = 'special'

  for (card of raw.DGM.cards)
    if (/Guildgate/.test(card.name))
      card.rarity = 'special'

  for (card of raw.CNS.cards)
    if ((card.type === 'Conspiracy')
      || /draft/.test(card.text))
      card.rarity = 'special'

  //http://mtgsalvation.gamepedia.com/Magic_2015/Sample_decks
  // Each sample deck has several cards numbered 270 and higher that do not
  // appear in Magic 2015 booster packs.
  raw.M15.cards = raw.M15.cards.filter(x => parseInt(x.number) < 270)
}

function after() {
  //no multiverseid
  for (var card of raw.HHO.cards) {
    var {name} = card
    var lc = (card.names ? card.names.join(' // ') : name).toLowerCase()
    Cards[lc].sets.HHO.url = `http://mtgimage.com/card/${name}.jpg`
  }

  var {DGM} = Sets
  DGM.special = {
    gate: DGM.special,
    shock: [
      'blood crypt',
      'breeding pool',
      'godless shrine',
      'hallowed fountain',
      'overgrown tomb',
      'sacred foundry',
      'steam vents',
      'stomping ground',
      'temple garden',
      'watery grave',
      'maze\'s end'
    ]
  }

  DGM.mythic.splice(DGM.mythic.indexOf("maze's end"), 1)
  for (var cardName of DGM.special.shock) {
    var {sets} = Cards[cardName]
    var codes = Object.keys(sets)
    var last = codes[codes.length - 1]
    sets.DGM = sets[last]
  }
}

function doSet(rawSet, code) {
  var cards = {}
  var set = {
    common: [],
    uncommon: [],
    rare: [],
    mythic: [],
    special: [],
  }
  var card

  for (card of rawSet.cards)
    doCard(card, cards, code, set)

  //because of split cards, do this only after processing the entire set
  for (var cardName in cards) {
    card = cards[cardName]
    var lc = cardName.toLowerCase()

    if (lc in Cards)
      Cards[lc].sets[code] = card.sets[code]
    else
      Cards[lc] = card
  }

  if (!rawSet.booster)
    return

  for (var rarity of ['mythic', 'special'])
    if (!set[rarity].length)
      delete set[rarity]

  set.size = rawSet.booster.filter(x => x === 'common').length
  Sets[code] = set
}

function doCard(rawCard, cards, code, set) {
  var rarity = rawCard.rarity.split(' ')[0].toLowerCase()
  if (rarity === 'basic')
    return

  var {name} = rawCard
  if (['double-faced', 'flip'].indexOf(rawCard.layout) > -1
    && name !== rawCard.names[0])
    return

  if (rawCard.layout === 'split')
    name = rawCard.names.join(' // ')

  name = util.name(name)

  if (name in cards) {
    if (rawCard.layout === 'split') {
      var card = cards[name]
      card.cmc += rawCard.cmc
      if (card.color !== rawCard.color)
        card.color = 'Y'
    }
    return
  }

  var {colors} = rawCard
  var color = !colors ? 'A' :
    colors.length > 1 ? 'Y' :
    colors[0] === 'Blue' ? 'U' :
    colors[0][0]

  set[rarity].push(name.toLowerCase())

  rarity = {
    special: 0,
    mythic: 1,
    rare: 2,
    uncommon: 3,
    common: 4
  }[rarity]

  cards[name] = { color, name,
    type: rawCard.types[rawCard.types.length - 1],
    cmc: rawCard.cmc || 0,
    sets: {
      [code]: { rarity,
        url: `http://mtgimage.com/multiverseid/${rawCard.multiverseid}.jpg`
      }
    }
  }
}
