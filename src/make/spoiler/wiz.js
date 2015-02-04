let cheerio = require('cheerio')

let $
let images = {}

function parse() {
  let $el = $(this)

  let name = $el.attr('alt')
    .replace('’', "'")
  let url = $el.attr('src')

  images[name] = url
}

module.exports = function (html) {
  $ = cheerio.load(html)
  $('div[align] img').each(parse)

  return images
}
