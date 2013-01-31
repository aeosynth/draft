fs = require 'fs'
webpage = require 'webpage'

sets = [
  'Limited Edition Alpha'
  'Limited Edition Beta'
  'Unlimited Edition'
  'Revised Edition'
  'Fourth Edition'
  'Fifth Edition'
  'Classic Sixth Edition'
  'Seventh Edition'
  'Eighth Edition'
  'Ninth Edition'
  'Tenth Edition'
  'Magic 2010'
  'Arabian Nights'
  'Anitiquities'
  'Legends'
  'The Dark'
  'Fallen Empires'
  'Homelands'
  'Ice Age'
  'Alliances'
  'Coldsnap'
  'Mirage'
  'Visions'
  'Weatherlight'
  'Tempest'
  'Stronghold'
  'Exodus'
  'Urza\'s Saga'
  'Urza\'s Legacy'
  'Urza\'s Destiny'
  'Mercadian Masques'
  'Nemesis'
  'Prophecy'
  'Invasion'
  'Planeshift'
  'Apocalypse'
  'Odyssey'
  'Torment'
  'Judgment'
  'Onslaught'
  'Legions'
  'Scourge'
  'Mirrodin'
  'Darksteel'
  'Fifth Dawn'
  'Champions of Kamigawa'
  'Betrayers of Kamigawa'
  'Saviors of Kamigawa'
  'Ravnica: City of Guilds'
  'Guildpact'
  'Dissension'
  'Time Spiral'
  'Planar Chaos'
  'Future Sight'
  'Lorwyn'
  'Morningtide'
  'Shadowmoor'
  'Eventide'
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
    cards = page.evaluate (SET) ->
      cards = []
      rarityRE = new RegExp "(?:^|, )#{SET} (Land|Common|Uncommon|Rare|Mythic Rare)"
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
            try
              obj.rarity = val.match(rarityRE)[1]
            catch err
              console.log "#{obj.name} not in #{SET}"
              # wtf '9th edition' sea eagle
              obj.rarity = 'Land'
          else
            obj[key] = val
      cards
    , SET
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
