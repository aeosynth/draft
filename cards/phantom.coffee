fs = require 'fs'
webpage = require 'webpage'

# XXX split cards (eg Fire // Ice) need massaging

sets = [
  'Gatecrash'
  'Return to Ravnica'
  'Magic 2013'
  'Avacyn Restored'
  'Dark Ascension'
  'Innistrad'
  'Magic 2012'
  'New Phyrexia'
  'Mirrodin Besieged'
  'Scars of Mirrodin'
  'Magic 2011'
  'Rise of the Eldrazi'
  'Worldwake'
  'Zendikar'
  'Magic 2010'
  'Alara Reborn'
  'Conflux'
  'Shards of Alara'
  'Eventide'
  'Shadowmoor'
  'Morningtide'
  'Lorwyn'
  'Tenth Edition'
  'Future Sight'
  'Planar Chaos'
  'Time Spiral'
  'Dissension'
  'Guildpact'
  'Ravnica: City of Guilds'
  'Ninth Edition'
  'Saviors of Kamigawa'
  'Betrayers of Kamigawa'
  'Champions of Kamigawa'
  'Fifth Dawn'
  'Darksteel'
  'Mirrodin'
  'Eighth Edition'
  'Scourge'
  'Legions'
  'Onslaught'
  'Judgment'
  'Torment'
  'Odyssey'
  'Seventh Edition'
  'Apocalypse'
  'Planeshift'
  'Invasion'
  'Classic Sixth Edition'
  'Prophecy'
  'Nemesis'
  'Mercadian Masques'
  'Urza\'s Destiny'
  'Urza\'s Legacy'
  'Urza\'s Saga'
  'Exodus'
  'Stronghold'
  'Tempest'
  'Fifth Edition'
  'Weatherlight'
  'Visions'
  'Mirage'
  'Coldsnap'
  'Alliances'
  'Ice Age'
  'Homelands'
  'Fourth Edition'
  'Fallen Empires'
  'The Dark'
  'Legends'
  'Revised Edition'
  'Anitiquities'
  'Arabian Nights'
  'Unlimited Edition'
  'Limited Edition Beta'
  'Limited Edition Alpha'
  'Portal Three Kingdoms'
  'Portal Second Age'
  'Portal'
  'Unhinged'
  'Unglued'
  'Magic: The Gathering-Commander'
]

Sets = {}
Cards = {}

process = ->
  if set = sets.pop()
    scrape set
  else
    # WTF
    od = sets.Odyssey.Rare
    bad = 'XXCall of the Herd (Call of the Herd)'
    good = 'Call of the Herd'
    i = od.indexOf(bad)
    if ~i
      od[i] = good
      Cards[good] = Cards[bad]
      Cards[good].name = good
      delete Cards[bad]

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
            val = val.replace 'Æ', 'AE' # cockatrice, mws both replace; must match for hash
            obj[key] = val
          when 'cost'
            cmc = parseInt(val) or 0
            [colored] = val.match /\D*$/g
            stripped = colored.replace(/[^RGBUW]/g, '') or 'L' # colorLess
            mono = /^(.)\1*$/.test stripped
            color = if mono then stripped[0] else 'Y' # yellow
            cmc += (colored.match(/[RGBUW]|\(.+?\)/g) || '').length # XXX mono-color hybrid
            obj.cmc = cmc
            obj.color = color
            obj[key] = val
          when 'color' # eg pact of negation
            if val is 'Blue'
              val = 'U'
            else
              val = val[...1]
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
    if set['Mythic Rare'].length is 0
      delete set['Mythic Rare']
    Sets[SET] = set
    page.close()
    process()

process()
