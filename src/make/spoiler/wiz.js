var cheerio = require('cheerio')

var $
var images = {}

function parse() {
  var $el = $(this)

  var name = $el.attr('alt')
    .replace('’', "'")
  var url = $el.attr('src')

  images[name] = url
}

module.exports = function (html) {
  $ = cheerio.load(html)
  $('div[align] img').each(parse)

  return images
}
