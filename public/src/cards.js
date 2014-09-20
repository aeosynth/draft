import _ from '../lib/utils'
import App from './app'

var Cards = {
  Plains:   { url: 'http://mtgimage.com/multiverseid/73963.jpg', name: 'Plains'   },
  Island:   { url: 'http://mtgimage.com/multiverseid/73951.jpg', name: 'Island'   },
  Swamp:    { url: 'http://mtgimage.com/multiverseid/73973.jpg', name: 'Swamp'    },
  Mountain: { url: 'http://mtgimage.com/multiverseid/73958.jpg', name: 'Mountain' },
  Forest:   { url: 'http://mtgimage.com/multiverseid/73946.jpg', name: 'Forest'   }
}

export var BASICS = Object.keys(Cards)

for (var name in Cards)
  Object.assign(Cards[name], {
    cmc: 0,
    code: 'UNH',
    color: 'colorless',
    rarity: 'basic',
    type: 'Land'
  })

var rawPack, clicked
export var Zones = {
  pack: {},
  main: {},
  side: {},
  junk: {}
}

function hash() {
  var {self, players} = App.state
  if (players[self].hash)
    return

  var {main, side} = Zones
  App.send('hash', { main, side })
}

var events = {
  add(cardName) {
    var zone = Zones[App.state.side ? 'side' : 'main']
    zone[cardName] || (zone[cardName] = 0)
    zone[cardName]++
    App.update()
  },
  click(zoneName, cardName, e) {
    if (zoneName === 'pack')
      return clickPack(cardName)

    var src = Zones[zoneName]
    var dst = Zones[e.shiftKey
      ? zoneName === 'junk' ? 'main' : 'junk'
      : zoneName === 'side' ? 'main' : 'side']

    dst[cardName] || (dst[cardName] = 0)

    src[cardName]--
    dst[cardName]++

    if (!src[cardName])
      delete src[cardName]

    App.update()
  },
  copy(ref) {
    var node = ref.getDOMNode()
    node.value = filetypes.txt()
    node.select()
    hash()
  },
  download() {
    var {filename, filetype} = App.state
    var data = filetypes[filetype]()
    _.download(data, filename + '.' + filetype)
    hash()
  },
  start() {
    var {bots, timer} = App.state
    var options = [bots, timer]
    App.send('start', options)
  },
  pack(cards) {
    rawPack = cards
    var {pack} = Zones

    for (var card of cards) {
      var {name} = card
      Cards[name] = card
      pack[name] = 1
    }
    App.update()
  },
  create() {
    var {type, seats} = App.state
    seats = Number(seats)
    var options = { type, seats }

    if (/cube/.test(type))
      options.cube = cube()
    else {
      var {sets} = App.state
      if (type === 'draft')
        sets = sets.slice(0, 3)
      options.sets = sets
    }

    App.send('create', options)
  },
  pool(cards) {
    ['main', 'side', 'junk'].forEach(zoneName => Zones[zoneName] = {})

    var zone = Zones[App.state.side
      ? 'side'
      : 'main']

    for (var card of cards) {
      var {name} = card
      Cards[name] = card

      zone[name] || (zone[name] = 0)
      zone[name]++
    }
    App.update()
  },
  land(zoneName, cardName, e) {
    var n = Number(e.target.value)
    if (n)
      Zones[zoneName][cardName] = n
    else
      delete Zones[zoneName][cardName]
    App.update()
  },
}

for (var event in events)
  App.on(event, events[event])

function codify(zone) {
  var arr = []
  for (var name in zone)
    arr.push(`    <card number="${zone[name]}" name="${name}"/>`)
  return arr.join('\n')
}

var filetypes = {
  cod() {
    return `\
<?xml version="1.0" encoding="UTF-8"?>
<cockatrice_deck version="1">
  <deckname>${App.state.filename}</deckname>
  <zone name="main">
${codify(Zones.main)}
  </zone>
  <zone name="side">
${codify(Zones.side)}
  </zone>
</cockatrice_deck>`
  },
  mwdeck() {
    var arr = []
    ;['main', 'side'].forEach(zoneName => {
      var prefix = zoneName === 'side' ? 'SB: ' : ''
      var zone = Zones[zoneName]
      for (var name in zone) {
        var {code} = Cards[name]
        var count = zone[name]
        name = name.replace(' // ', '/')
        arr.push(`${prefix}${count} [${code}] ${name}`)
      }
    })
    return arr.join('\n')
  },
  json() {
    var {main, side} = Zones
    return JSON.stringify({ main, side }, null, 2)
  },
  txt() {
    var arr = []
    ;['main', 'side'].forEach(zoneName => {
      if (zoneName === 'side')
        arr.push('Sideboard')
      var zone = Zones[zoneName]
      for (var name in zone) {
        var count = zone[name]
        arr.push(count + ' ' + name)
      }
    })
    return arr.join('\n')
  }
}

function cube() {
  var {list, cards, packs} = App.state
  cards = Number(cards)
  packs = Number(packs)

  list = list
    .split('\n')
    .map(x => x
      .trim()
      .replace(/^\d+.\s*/, '')
      .replace(/\s*\/+\s*/g, ' // ')
      .toLowerCase())
    .filter(x => x)
    .join('\n')

  return { list, cards, packs }
}

function clickPack(cardName) {
  if (clicked !== cardName)
    return clicked = cardName

  var index = rawPack.findIndex(x => x.name === cardName)
  clicked = null
  Zones.pack = {}
  App.update()
  App.send('pick', index)
}

function Key(groups, sort) {
  var keys = Object.keys(groups)

  switch(sort) {
    case 'cmc':
      var arr = []
      for (var key in groups)
        if (parseInt(key) > 6) {
          ;[].push.apply(arr, groups[key])
          delete groups[key]
        }

      if (arr.length) {
        groups['6'] || (groups['6'] = [])
        ;[].push.apply(groups['6'], arr)
      }
      return groups

    case 'color':
      keys =
        ['colorless', 'white', 'blue', 'black', 'red', 'green', 'multicolor']
        .filter(x => keys.indexOf(x) > -1)
      break
    case 'rarity':
      keys =
        ['basic', 'common', 'uncommon', 'rare', 'mythic', 'special']
        .filter(x => keys.indexOf(x) > -1)
      break
    case 'type':
      keys = keys.sort()
      break
  }

  var o = {}
  for (var key of keys)
    o[key] = groups[key]
  return o
}

export function getZone(zoneName) {
  var zone = Zones[zoneName]

  var cards = []
  for (var cardName in zone)
    for (var i = 0; i < zone[cardName]; i++)
      cards.push(Cards[cardName])

  var {sort} = App.state
  var groups = _.group(cards, sort)
  for (var key in groups)
    _.sort(groups[key], 'name')

  groups = Key(groups, sort)

  return groups
}
