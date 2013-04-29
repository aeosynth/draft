var fs, getCards, getSetNames, Cards, Sets, replace, write;
fs = require('fs');
getCards = require('./getCards');
getSetNames = require('./getSetNames');
Cards = {};
Sets = {};
getSetNames(function(err, setNames){
  var regex, res$, i$, len$, setName, scrape;
  if (err) {
    throw err;
  }
  regex = /(Box Set|Duel Deck|From the Vault|Masters Edition|Premium Deck|Promo set|Vanguard)/;
  res$ = [];
  for (i$ = 0, len$ = setNames.length; i$ < len$; ++i$) {
    setName = setNames[i$];
    if (!regex.test(setName)) {
      res$.push(setName);
    }
  }
  setNames = res$;
  return (scrape = function(){
    var setName;
    if (!(setName = setNames.pop())) {
      write();
      return;
    }
    console.log(setName);
    return getCards(setName, function(err, cards){
      var set, i$, len$, card, name, rarity;
      if (err) {
        throw err;
      }
      set = Sets[setName] = {
        common: [],
        uncommon: [],
        rare: [],
        mythic: [],
        special: []
      };
      for (i$ = 0, len$ = cards.length; i$ < len$; ++i$) {
        card = cards[i$];
        name = card.name, rarity = card.rarity;
        if (rarity === 'land') {
          continue;
        }
        set[rarity].push(name);
        Cards[name] = card;
      }
      if (!set.special.length) {
        delete set.special;
      }
      return scrape();
    });
  })();
});
replace = function(setName, rarity, bad){
  var good, names, index, card, ref$;
  good = bad.match(/\((.+)\)/)[1];
  names = Sets[setName][rarity];
  index = names.indexOf(bad);
  if (index === -1) {
    console.log(good + " in " + setName + " doesn't need fixing");
    return;
  }
  names[index] = good;
  if (card = (ref$ = Cards[bad], delete Cards[bad], ref$)) {
    Cards[good] = card;
    return card.name = good;
  }
};
write = function(){
  var dgm, res$, i$, ref$, len$, name, j$, ref1$, len1$, setName, rarity, set, res1$, k$, ref2$, len2$, card, tst;
  Cards['Mana Crypt'] = {
    cmc: 0,
    color: 'A',
    name: 'Mana Crypt',
    rarity: 'rare',
    url: 'http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=97048&type=card'
  };
  dgm = Sets["Dragon's Maze"];
  dgm.special = {
    gate: ['Azorius Guildgate', 'Boros Guildgate', 'Dimir Guildgate', 'Golgari Guildgate', 'Gruul Guildgate', 'Izzet Guildgate', 'Orzhov Guildgate', 'Rakdos Guildgate', 'Selesnya Guildgate', 'Simic Guildgate'],
    shock: ['Blood Crypt', 'Breeding Pool', 'Godless Shrine', 'Hallowed Fountain', 'Overgrown Tomb', 'Sacred Foundry', 'Steam Vents', 'Stomping Ground', 'Temple Garden', 'Watery Grave']
  };
  res$ = [];
  for (i$ = 0, len$ = (ref$ = dgm.common).length; i$ < len$; ++i$) {
    name = ref$[i$];
    if (!~dgm.special.gate.indexOf(name)) {
      res$.push(name);
    }
  }
  dgm.common = res$;
  for (j$ = 0, len1$ = (ref1$ = ['Innistrad', 'Dark Ascension']).length; j$ < len1$; ++j$) {
    setName = ref1$[j$];
    for (rarity in set = Sets[setName]) {
      res1$ = [];
      for (k$ = 0, len2$ = (ref2$ = set[rarity]).length; k$ < len2$; ++k$) {
        name = ref2$[k$];
        card = Cards[name];
        if (card.cost || card.type === 'land') {
          res1$.push(name);
        }
      }
      set[rarity] = res1$;
    }
  }
  tst = 'Time Spiral "Timeshifted"';
  Sets['Time Spiral'].special = Sets[tst].special;
  delete Sets[tst];
  replace('Odyssey', 'rare', "XXCall of the Herd (Call of the Herd)");
  replace("Time Spiral", 'special', "XXCall of the Herd (Call of the Herd)");
  replace('Judgment', 'uncommon', "XXValor (Valor)");
  replace("Time Spiral", 'special', "XXValor (Valor)");
  fs.writeFileSync('cards/cards.json', JSON.stringify(Cards, null, 2));
  fs.writeFileSync('cards/sets.json', JSON.stringify(Sets, null, 2));
  return console.log('done');
};