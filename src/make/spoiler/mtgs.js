let cheerio = require('cheerio')
let _ = require('../../_')

let Cards = {}
let COLORS = {
  W: 'white',
  U: 'blue',
  B: 'black',
  R: 'red',
  G: 'green'
}
let $, code, images

function parse() {
  let $el = $(this)

  let rarity = $el
    .find('.t-spoiler-rarity span')
    .attr('class')
    .match(/\w+$/)[0]

  if (rarity === 'land' || rarity === 'unknown')
    return

  let name = _.ascii($el.attr('id'))
  let lc = name.toLowerCase()
  let url = images[lc]
  if (!url)
    return

  let type = $el
    .find('.t-spoiler-type')
    .text()
    .split(' - ')[0].trim()
    .match(/\w+$/)[0]

  let cost = $el
    .find('.t-spoiler-mana')
    .text()
    .replace(/\s+/g, '')

  let colors = cost.match(/\D*$/)[0].replace('X', '')
  let cmc = (parseInt(cost) || 0) + colors.length

  let color
    = !colors.length ? 'colorless'
    : !/^(.)\1*$/.test(colors) ? 'multicolor'
    : COLORS[colors[0]]

  Cards[lc] = { cmc, color, name, type,
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
