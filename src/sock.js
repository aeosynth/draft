var {EventEmitter} = require('events')

function message(msg) {
  var [type, data] = JSON.parse(msg)
  this.emit(type, data, this)
}

var mixins = {
  err(msg) {
    this.send('error', msg)
  },
  send(type, data) {
    this.ws.send(JSON.stringify([type, data]))
  },
  exit() {
    this.emit('exit', this)
  }
}

module.exports = class extends EventEmitter {
  constructor(ws) {
    this.ws = ws
    var {id='', name='dr4fter'} = ws.request._query
    this.id = id.slice(0, 25)
    this.name = name.slice(0, 15)

    for (var key in mixins)
      this[key] = mixins[key].bind(this)

    ws.on('message', message.bind(this))
    ws.on('close', this.exit)
  }
  mixin(h) {
    h.sock = this
    this.h = h
    for (var key in mixins)
      h[key] = this[key]
  }
}
