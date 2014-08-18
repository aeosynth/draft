var App = {
  __proto__: EventEmitter,

  state: {
    component: null,
    name: 'newfriend',

    seats: 8,
    type: 'sealed',
    sets: [
      'M15',
      'M15',
      'M15',
      'M15',
      'M15',
      'M15'
    ],
    list: '',
    cards: 15,
    packs: 3,

    beep: false,
    bots: true,
    filename: 'filename',
    filetype: 'txt',
    sort: 'color',
    zone: 'main'
  },
  init() {
    console.log('%chttps://github.com/aeosynth/draft', 'font-size:20pt');

    var key, val, state = this.state;
    for (key in state) {
      if (val = localStorage[key])
        try {
          state[key] = JSON.parse(val);
        } catch(err) {}
    }

    var {id} = localStorage;
    if (!id)
      id = localStorage.id = Math.random().toString(36).slice(2);
    state.id = id;

    React.renderComponent(View(), document.body);
    addEventListener('hashchange', this.doRoute.bind(this));
    this.doRoute()
    this.connect();

    this.getHelpHTML()
  },
  getHelpHTML() {
    var x = new XMLHttpRequest()
    x.open('get', 'out/help.html')
    x.onload = e => {
      this.helpHTML = e.target.response
      if (this.state.component instanceof Help)
        this.update()
    }
    x.send()
  },
  connect() {
    var {id, name} = App.state;
    var options = {
      query: { id, name }
    };

    var ws = this.ws = eio('ws://' + location.host, options);
    ws.on('open', App.onOpen.bind(App))
    ws.on('message', (msg) => {
      var [type, data] = JSON.parse(msg);
      switch(type) {
        case 'error':
          return App.err(data);
        case 'route':
          return App.route(data);
        default:
          this.emit(type, data);
      }
    });
    ws.on('close', ()=> console.log('close'))
  },
  onOpen() {
    console.log('open')
    this.send = function (type, data) {
      this.ws.send(JSON.stringify([type, data]));
    }
    if (this._send) {
      this.send(this._send[0], this._send[1]);
      delete this._send;
    }
  },
  send(type, data) {
    this._send = [type, data]
  },
  route(path) {
    if (location.hash === path)
      this.doRoute();
    else
      location.hash = path;
  },
  doRoute() {
    var hash = location.hash.slice(1);
    var component;
    if (hash === 'help') {
      this.state.err = null
      component = Help();
    }
    else if (hash.slice(0,2) === 'q/') {
      this.state.err = null
      var room = hash.slice(2);
      this.emit('join', room)
      component = Game({ room });
    }
    else {
      if (hash) {
        this.state.err = `room ${hash} not found`;
        return this.route('')
      }
      component = Lobby();
    }
    this.state.component = component
    this.update()
  },
  change(key, path) {
    return e => {
      var {target} = e
      var val;
      switch (target.type) {
        case 'checkbox': val = target.checked; break;
        case 'submit': val = target.textContent; break;
        default: val = target.value;
      }
      if (path !== void 0) {
        var tmp = this.state[key];
        tmp[path] = val;
        val = tmp;
      }
      this.save(key, val);
    }
  },
  save(key, val) {
    localStorage[key] = JSON.stringify(val);
    this.state[key] = val
    this.update()
  },
  err(err) {
    this.state.err = err
    this.route('');
  }
};

App.init();
