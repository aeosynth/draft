var ask = require('ask')
var ads = require('./data').ads

function shortest() {
  // https://shorte.st/tools/api
  // this api so wtf. only way i could get it working was to set content-type
  // without actually encoding the data

  var opts = {
    method: 'put',
    headers: {
      'public-api-token': token,
      'content-type': 'application/x-www-form-urlencoded'
    },
    url: 'https://api.shorte.st/v1/data/url',
    data: 'urlToShorten=drafts.in/#q/'
  }

  function wrap(cb) {
    return function(err, data, res) {
      if (err)
        return cb(err)

      try { data = JSON.parse(data) }
      catch(err) { return cb(err) }

      if (data.status !== 'ok')
        err = Error('status not ok: ' + data.status)

      cb(err, data.shortenedUrl)
    }
  }
}

function adfly(gameID, cb) {
  var url = ads.adfly + gameID
  ask(url, cb)
}

module.exports = adfly
