var cheerio = require('cheerio')

var Cards = {}
var COLORS = {
  W: 'white',
  U: 'blue',
  B: 'black',
  R: 'red',
  G: 'green'
}
var $, code, images

function parse() {
  var $el = $(this)

  var rarity = $el
    .find('.t-spoiler-rarity span')
    .attr('class')
    .match(/\w+$/)[0]

  if (rarity === 'land' || rarity === 'unknown')
    return

  var name = $el.attr('id')
  var url = images[name]
  if (!url)
    return

  var type = $el
    .find('.t-spoiler-type')
    .text()
    .split(' - ')[0].trim()
    .match(/\w+$/)[0]

  var cost = $el
    .find('.t-spoiler-mana')
    .text()
    .replace(/\s+/g, '')

  var colors = cost.match(/\D*$/)[0].replace('X', '')
  var cmc = (parseInt(cost) || 0) + colors.length

  var color
    = !colors.length ? 'colorless'
    : !/^(.)\1*$/.test(colors) ? 'multicolor'
    : COLORS[colors[0]]

  Cards[name] = { cmc, color, name, type,
    sets: {
      [code]: { rarity, url }
    }
  }
}

module.exports = function (html, _images, _code) {
  code = _code
  images = _images
  $ = cheerio.load(html)
  $('.t-spoiler').each(parse)

  return Cards
}
