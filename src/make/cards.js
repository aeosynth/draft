var fs = require('fs')
var _ = require('../_')
var raw = require('../../data/AllSets')

var COLORS = {
  W: 'White',
  U: 'Blue',
  B: 'Black',
  R: 'Red',
  G: 'Green'
}

var Cards = {}
var Sets = {}

before()

var types = ['core', 'expansion', 'commander', 'planechase', 'starter', 'un']
var codes = ['MMA', 'VMA', 'CNS', 'TPR', 'MM2']
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

  ;['BFZ', 'OGW'].forEach(setName => {
    for (card of raw[setName].cards)
      if (card.text && card.text.startsWith('Devoid'))
        card.colors = card.manaCost
          .replace(/[\d{}]/g, '')
          .replace(/(.)\1+/g, '$1')
          .split('')
          .map(c => COLORS[c])
  })

  var card
  for (card of raw.SOI.cards)
    if (card.layout === 'double-faced')
      card.rarity = 'special'
  
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

  for (card of raw.FRF.cards)
    if (card.types[0] === 'Land'
      && (card.name !== 'Crucible of the Spirit Dragon'))
      card.rarity = 'special'

  //http://mtgsalvation.gamepedia.com/Magic_2015/Sample_decks
  // Each sample deck has several cards numbered 270 and higher that do not
  // appear in Magic 2015 booster packs.
  raw.M15.cards = raw.M15.cards.filter(x => parseInt(x.number) < 270)

  raw.OGW.cards.find(x => x.name === 'Wastes').rarity = 'Common'
}

function after() {
  var {SOI} = Sets
  SOI.special = {
    "mythic": [
      "archangel avacyn",
      "startled awake",
      "arlinn kord"
    ],
    "rare": [
      "hanweir militia captain",
      "elusive tormentor",
      "thing in the ice",
      "geier reach bandit",
      "sage of ancient lore",
      "westvale abbey"
    ],
    "uncommon": [
      "avacynian missionaries",
      "pious evangel",
      "town gossipmonger",
      "aberrant researcher",
      "daring sleuth",
      "uninvited geist",
      "accursed witch",
      "heir of falkenrath",
      "kindly stranger",
      "breakneck rider",
      "convicted killer",
      "skin invasion",
      "village messenger",
      "autumnal gloom",
      "duskwatch recruiter",
      "hermit of the natterknolls",
      "lambholt pacifist",
      "harvest hand",
      "neglected heirloom",
      "thraben gargoyle"
    ],
    "common": [
      "convicted killer",
      "gatstaf arsonists",
      "hinterland logger",
      "solitary hunter"
    ]
  }
  SOI.size = 8
  var {ISD} = Sets
  ISD.special = {
    mythic: [
      'garruk relentless'
    ],
    rare: [
      'bloodline keeper',
      'daybreak ranger',
      'instigator gang',
      'kruin outlaw',
      'ludevic\'s test subject',
      'mayor of avabruck'
    ],
    uncommon: [
      'civilized scholar',
      'cloistered youth',
      'gatstaf shepherd',
      'hanweir watchkeep',
      'reckless waif',
      'screeching bat',
      'ulvenwald mystics'
    ],
    common: [
      'delver of secrets',
      'grizzled outcasts',
      'thraben sentry',
      'tormented pariah',
      'village ironsmith',
      'villagers of estwald'
    ]
  }
  var {DKA} = Sets
  DKA.special = {
    mythic: [
      'elbrus, the binding blade',
      'huntmaster of the fells'
    ],
    rare: [
      'mondronen shaman',
      'ravenous demon'
    ],
    uncommon: [
      'afflicted deserter',
      'chalice of life',
      'lambholt elder',
      'soul seizer'
    ],
    common: [
      'chosen of markov',
      'hinterland hermit',
      'loyal cathar',
      'scorned villager'
    ]
  }
  var {DGM} = Sets
  DGM.mythic.splice(DGM.mythic.indexOf("maze's end"), 1)
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
  alias(DGM.special.shock, 'DGM')

  var {FRF} = Sets
  for (let card of FRF.special)
    Cards[card].sets.FRF.rarity = / /.test(card) ? 'common' : 'basic'
  FRF.special = {
    common: FRF.special,
    fetch: [
      'flooded strand',
      'bloodstained mire',
      'wooded foothills',
      'windswept heath',
      'polluted delta',
    ]
  }
  alias(FRF.special.fetch, 'FRF')

  Sets.OGW.common.push('wastes')// wastes are twice as common
}

function alias(arr, code) {
  // some boosters contain reprints which are not in the set proper
  for (var cardName of arr) {
    var {sets} = Cards[cardName]
    var codes = Object.keys(sets)
    var last = codes[codes.length - 1]
    sets[code] = sets[last]
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
    && rawCard.number.indexOf('b') > -1)
    return

  if (rawCard.layout === 'split')
    name = rawCard.names.join(' // ')

  //separate landsfrom 0cmc cards by setting 0cmc to .2
  var cmcadjusted = rawCard.cmc || 0.2

  name = _.ascii(name)

  if (name in cards) {
    if (rawCard.layout === 'split') {
      var card = cards[name]
      cmcadjusted = card.cmc + rawCard.cmc
      if (card.color !== rawCard.color)
        card.color = 'multicolor'
    }
    return
  }

  var {colors} = rawCard
  var color = !colors ? 'colorless' :
    colors.length > 1 ? 'multicolor' :
    colors[0].toLowerCase()
  
  //set lands to .1 to sort them before nonland 0cmc  
  if ('Land'.indexOf(rawCard.types) > -1)
    cmcadjusted = 0.1

  cards[name] = { color, name,
    type: rawCard.types[rawCard.types.length - 1],
    cmc: cmcadjusted, 
    text: rawCard.text || '',
    manaCost: rawCard.manaCost || '',
    sets: {
      [code]: { rarity,
        url: `http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=${rawCard.multiverseid}&type=card`
      }
    }
  }

  set[rarity].push(name.toLowerCase())
}
