fs = require 'fs'
webpage = require 'webpage'

sets = [
  'Shards of Alara'
  'Conflux'
  'Alara Reborn'
  'Zendikar'
  'Worldwake'
  'Rise of the Eldrazi'
  'Magic 2011'
  'Scars of Mirrodin'
  'Mirrodin Besieged'
  'New Phyrexia'
  'Magic 2012'
  'Innistrad'
  'Dark Ascension'
  'Avacyn Restored'
  'Magic 2013'
  'Return to Ravnica'
  'Gatecrash'
]

Sets = {}
Cards = {}

process = ->
  if set = sets.pop()
    scrape set
  else
    fs.write 'cards/sets.json' , JSON.stringify(Sets) , 'w'
    fs.write 'cards/cards.json', JSON.stringify(Cards), 'w'
    phantom.exit()

scrape = (SET) ->
  url = "http://gatherer.wizards.com/Pages/Search/Default.aspx?output=spoiler&method=text&action=advanced&set=%5b%22#{SET}%22%5d"

  page = webpage.create()
  page.onConsoleMessage = (msg, lineNum, sourceId) ->
    console.log "page: #{msg}"
  page.open url, (status) ->
    console.log SET, status
    cards = page.evaluate ->
      cards = []
      for row, i in document.querySelectorAll '.textspoiler tr'
        [keyCell, valCell] = row.cells
        key = keyCell.textContent.trim()

        unless key
          cards.push obj
          continue

        val = valCell.textContent.trim()
        key = key[0...-1].toLowerCase()

        switch key
          when 'name'
            [id] = valCell.firstElementChild.search.match /\d+/
            obj = { id }
            obj[key] = val
          when 'pow/tgh', 'loyalty'
            continue unless val
            [_, val] = val.match /\((.+)\)/
            obj[key] = val
          when 'set/rarity'
            # XXX cards can be in multiple sets, with different rarities
            # this only looks at most recent set / rarity
            [val] = val.split ', '
            split = val.split ' '
            rarity = split.pop()
            if (rarity is 'Rare') and (split[split.length-1] is 'Mythic')
              rarity = 'Mythic Rare'
            obj.rarity = rarity
          else
            obj[key] = val
      cards
    set =
      Land: []
      Common: []
      Uncommon: []
      Rare: []
      'Mythic Rare': []
    for card in cards
      set[card.rarity].push card.name
      Cards[card.name] = card
    delete set.Land
    Sets[SET] = set
    page.close()
    process()

process()
