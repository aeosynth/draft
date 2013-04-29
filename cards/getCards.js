var request, cheerio, getCards, parse, join$ = [].join;
request = require('request');
cheerio = require('cheerio');
getCards = function(setName, cb){
  var url;
  url = "http://gatherer.wizards.com/Pages/Search/Default.aspx?output=spoiler&set=[%22" + setName + "%22]";
  return request(url, function(err, res, html){
    var cards;
    if (err) {
      cb(err);
      return;
    }
    cards = parse(html, setName);
    return cb(null, cards);
  });
};
parse = function(html, setName){
  var card, cards, split, rarityRE, $, joined, i$, len$, name, half, j$, len1$, cost, colors;
  cards = [];
  split = [];
  rarityRE = new RegExp("(?:^|, )" + setName + " (Land|Common|Uncommon|Rare|Mythic Rare|Special)");
  $ = cheerio.load(html);
  $('.textspoiler tr').each(function(){
    var cells, key, $val, val, id, cost, ref$, _, colorless, colored, match, rarity;
    cells = $(this).find('td');
    if (!(key = $(cells[0]).text().trim())) {
      return;
    }
    key = key.replace(':', '').toLowerCase();
    $val = $(cells[1]);
    val = $val.text().trim();
    if (!val) {
      return;
    }
    switch (key) {
    case 'name':
      id = $($val.find('a')).attr('href').match(/\d+/)[0];
      card = {
        cmc: 0,
        url: "http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=" + id + "&type=card",
        name: val.replace('Æ', 'AE')
      };
      if (~val.indexOf('//')) {
        return split.push(card);
      } else {
        return cards.push(card);
      }
      break;
    case 'cost':
      card.cost = val;
      cost = val.replace('X', '').replace(/\(\w\/\w\)/g, function(it){
        var ref$, _, left, right;
        ref$ = it.match(/(\w)\/(\w)/), _ = ref$[0], left = ref$[1], right = ref$[2];
        if (left === 2) {
          card.cmc += 1;
          return right;
        }
        if (right === 'P') {
          return left;
        }
        return 'Y';
      });
      ref$ = cost.match(/(\d*)(\w*)/), _ = ref$[0], colorless = ref$[1], colored = ref$[2];
      return card.cmc += parseInt(colorless || 0) + colored.length;
    case 'color':
      return card.color = val === 'Blue'
        ? 'U'
        : val[0];
    case 'set/rarity':
      if (match = val.match(rarityRE)) {
        rarity = match[1];
        if (rarity === 'Mythic Rare') {
          rarity = 'mythic';
        }
      } else if (card.name === "Sea Eagle") {
        rarity = 'common';
      } else {
        rarity = 'land';
        console.log("rarity not found: [" + card.name + "] [" + val + "]");
      }
      return card.rarity = rarity.toLowerCase();
    default:
      return card[key] = val;
    }
  });
  joined = {};
  for (i$ = 0, len$ = split.length; i$ < len$; ++i$) {
    card = split[i$];
    name = card.name.replace(/\ \(.+/, '');
    half = joined[name] || (joined[name] = {
      cmc: 0,
      cost: '',
      name: name,
      url: card.url,
      rarity: card.rarity
    });
    half.cmc += card.cmc;
    half.cost += card.cost;
  }
  for (name in joined) {
    card = joined[name];
    cards.push(card);
  }
  for (j$ = 0, len1$ = cards.length; j$ < len1$; ++j$) {
    card = cards[j$];
    if (card.color) {
      continue;
    }
    if (!((cost = card.cost) && (colors = cost.match(/R|G|B|U|W/g)))) {
      card.color = 'A';
      continue;
    }
    card.color = /^(.)\1*$/.test(join$.call(colors, '')) ? colors[0] : 'Y';
  }
  return cards;
};
module.exports = getCards;