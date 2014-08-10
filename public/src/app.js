var App = {
  __proto__: EventEmitter,

  state: {
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
    filetype: 'dec',
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
      id = localStorage.id = Math.random(9e9).toString(32).slice(2);
    state.id = id;

    addEventListener('hashchange', this.route.bind(this));
    React.renderComponent(View(), document.body);
  },
  route() {
    var hash = location.hash.slice(1);
    var {msg} = this;
    var component;
    if (hash === 'help')
      component = Help();
    else if (hash.slice(0,2) === 'q/') {
      var room = hash.slice(2);
      this.emit('join', room)
      component = Game({ room });
    }
    else {
      if (hash)
        msg = `room ${hash} not found`;
      component = Lobby({ err: msg });
    }
    this.emit('route', component);
    this.msg = null;
  },
  change(key, path) {
    return {target} => {
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
    this.set(key, val);
  },
  set(key, val) {
    this.state[key] = val;
    this.emit('update');
  },
  err(msg) {
    this.msg = msg;
    if (location.hash)
      location.hash = '';
    else
      this.route();
  }
};

App.init();
