import _ from '../lib/utils'
import EventEmitter from '../lib/ee'

function message(msg) {
  var args = JSON.parse(msg)
  App.emit(...args)
}

var App = {
  __proto__: new EventEmitter,

  state: {
    id: null,
    name: 'newfriend',

    seats: 8,
    type: 'draft',
    sets: [
      'KTK',
      'KTK',
      'KTK',
      'KTK',
      'KTK',
      'KTK'
    ],
    list: '',
    cards: 15,
    packs: 3,

    bots: true,
    timer: true,

    beep: false,
    chat: true,
    cols: false,
    filename: 'filename',
    filetype: 'txt',
    side: false,
    sort: 'color',
  },

  init(router) {
    App.on('set', App.set)
    App.on('error', App.error)
    App.on('route', App.route)

    App.restore()
    App.connect()
    router(App)
  },
  restore() {
    for (var key in this.state) {
      var val = localStorage[key]
      if (val) {
        try {
          this.state[key] = JSON.parse(val)
        } catch(e) {
          delete localStorage[key]
        }
      }
    }

    if (!this.state.id) {
      this.state.id = _.uid()
      localStorage.id = JSON.stringify(this.state.id)
    }
  },
  connect() {
    var {id, name} = App.state
    var options = {
      query: { id, name }
    }
    var ws = this.ws = eio('ws://sock.drafts.in', options)
    ws.on('open' , ()=> console.log('open'))
    ws.on('close', ()=> console.log('close'))
    ws.on('message', message)
  },
  send(...args) {
    var msg = JSON.stringify(args)
    this.ws.send(msg)
  },
  error(err) {
    App.err = err
    App.route('')
  },
  route(path) {
    if (path === location.hash.slice(1))
      App.update()
    else
      location.hash = path
  },
  save(key, val) {
    this.state[key] = val
    localStorage[key] = JSON.stringify(val)
    App.update()
  },
  set(state) {
    Object.assign(App.state, state)
    App.update()
  },
  update() {
    React.renderComponent(App.component, document.body)
  },
  _emit(...args) {
    return App.emit.bind(App, ...args)
  },
  _save(key, val) {
    return App.save.bind(App, key, val)
  },
  link(key, index) {
    var hasIndex = index !== void 0

    var value = App.state[key]
    if (hasIndex)
      value = value[index]

    function requestChange(val) {
      if (hasIndex) {
        var tmp = App.state[key]
        tmp[index] = val
        val = tmp
      }
      App.save(key, val)
    }

    return { requestChange, value }
  },
}

export default App
