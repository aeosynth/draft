SET = 'Return to Ravnica'
URL = "http://gatherer.wizards.com/Pages/Search/Default.aspx?output=spoiler&method=text&action=advanced&set=%5b%22#{SET}%22%5d"

Sets = {}

page = require('webpage').create()
page.open URL, (status) ->
  set = page.evaluate ->
    set =
      Land: []
      Common: []
      Uncommon: []
      Rare: []
      'Mythic Rare': []
    type = [
      'name'
      'cost'
      'type'
      'stats'
      'text'
      'set/rarity'
      'blank'
    ]
    typeLength = type.length
    for row, i in document.querySelectorAll '.textspoiler tr'
      key = type[i % typeLength]
      if key is 'blank'
        set[obj.rarity].push obj
        continue
      cell = row.cells[1]
      val = cell.textContent.trim()
      switch key
        when 'name'
          [id] = cell.firstElementChild.search.match /\d+/
          obj = { id }
          obj[key] = val
        when 'stats'
          # p/t, or loyalty
          if val
            key = row.cells[0].textContent.trim()
            key = if key is 'Loyalty:' then 'loyalty' else 'p/t'
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
            split.pop()
          obj.set = split.join ' '
          obj.rarity = rarity
        else
          obj[key] = val
    set
  Sets[SET] = set
  console.log JSON.stringify Sets

  phantom.exit()
