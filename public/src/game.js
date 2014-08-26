var ZONES = ['main', 'side'];

var Game = React.createClass({
  getInitialState() {
    return {
      messages: [],

      decklist: '',
      isHost: false,
      selected: null,
      self: null,
      land: this.resetLand(),
      players: [],
      pack: [],
      main: [],
      side: [],
      junk: []
    };
  },

  events: {
    copy(ref) {
      this.setState({decklist: this.generate('txt')},
        ()=> ref.getDOMNode().select())
    },

    join(room) {
      this.setState(this.getInitialState());
      App.send('join', room);
    },
    add(card) {
      var state = {};
      var {zone} = App.state
      state[zone] = this.state[zone].concat(card);
      this.setState(state);
    },
    hear(msg) {
      var messages = this.state.messages.concat(msg)
      this.setState({ messages })
    },
    set(state) {
      if (state.pool) {
        state[App.state.zone] = state.pool;
        delete state.pool;
      }
      if (state.pack && App.state.beep)
        this.refs.audio.getDOMNode().play();
      this.setState(state);
    },
    start() {
      App.send('start', App.state.bots);
    },
    clickPack(name) {
      if (this.state.selected !== name)
        return this.state.selected = name;

      var {pack} = this.state
      for (var i = 0; i < pack.length; i++)
        if (pack[i].name === name)
          break
      App.send('pick', i);
      this.setState({pack: [], selected: null});
    },

    clickPool(cardName, zoneName, e) {
      var {land, main, side, junk} = this.state;
      var from = this.state[zoneName];

      for (var i = 0; i < from.length; i++)
        if (from[i].name === cardName)
          break
      var card = from[i];

      if (card.key) {
        var {key} = card;
        land[zoneName][key]--;
        this.setLand(land);
        return;
      }

      var to;
      if (e.shiftKey)
        to = zoneName === 'junk' ? main : junk;
      else
        to = zoneName === 'side' ? main : side;

      from.splice(i, 1);
      to.push(card);
      this.setState({ main, side, junk });
    },
    download() {
      var {filename, filetype} = App.state;

      var fileText = this.generate(filetype);

      var link = document.createElement('a');
      link.download = filename + '.' + filetype;
      link.href = 'data:,' + encodeURIComponent(fileText);
      document.body.appendChild(link);
      link.click();
      link.remove();
    },
    changeLand(color, zoneName, e) {
      var {land} = this.state;
      land[zoneName][color] = parseInt(e.target.value);
      this.setLand(land);
    },

    changeZone(e) {
      var {value} = e.target;
      var {main, side} = this.state;
      var all = main.concat(side).filter(x => !x.key)
      value === 'main' ?
        (main = all, side = []) :
        (main = [],  side = all);

      var land = this.resetLand();

      this.setState({ land, main, side });
      App.save('zone', value);
    },

    kick(i) {
      App.send('kick', i)
    }
  },

  componentDidMount() {
    this.decrement();
    for (var event in this.events)
      App.on(event, this.events[event].bind(this))

    App.send('join', this.props.room)
  },
  componentWillUnmount() {
    clearTimeout(this.timeoutID);
    App.off()
  },

  decrement() {
    this.state.players.forEach(x => {
      if (x.time)
        x.time--;
    });
    this.forceUpdate();
    this.timeoutID = setTimeout(this.decrement, 1e3);
  },

  lands: {
    w: { cmc: 0, code: 'UNH', color: 'colorless', rarity: 'basic', type: 'Land', key: 'w', url: 'http://mtgimage.com/multiverseid/73963.jpg', name: 'Plains'   },
    u: { cmc: 0, code: 'UNH', color: 'colorless', rarity: 'basic', type: 'Land', key: 'u', url: 'http://mtgimage.com/multiverseid/73951.jpg', name: 'Island'   },
    b: { cmc: 0, code: 'UNH', color: 'colorless', rarity: 'basic', type: 'Land', key: 'b', url: 'http://mtgimage.com/multiverseid/73973.jpg', name: 'Swamp'    },
    r: { cmc: 0, code: 'UNH', color: 'colorless', rarity: 'basic', type: 'Land', key: 'r', url: 'http://mtgimage.com/multiverseid/73958.jpg', name: 'Mountain' },
    g: { cmc: 0, code: 'UNH', color: 'colorless', rarity: 'basic', type: 'Land', key: 'g', url: 'http://mtgimage.com/multiverseid/73946.jpg', name: 'Forest'   }
  },

  setLand(land) {
    ZONES.forEach(zoneName => {
      var zone = this.state[zoneName].filter(x => !x.key)
      var color, i;
      for (color in land[zoneName]) {
        i = 0;
        while (i++ < land[zoneName][color])
          zone.push(this.lands[color]);
      }
      this.state[zoneName] = zone;
    });
    this.forceUpdate();
  },

  resetLand() {
    var land = {};
    ZONES.forEach(zoneName => {
      land[zoneName] = {};
      ['w', 'u', 'b', 'r', 'g'].forEach(color =>
        land[zoneName][color] = 0);
    });
    return land;
  },

  generate(filetype) {
    var deck = {
      main: {},
      side: {}
    };
    var codes = {};
    ZONES.forEach(zone => {
      this.state[zone].forEach(card => {
        var {code, name} = card;
        codes[name] = code;
        deck[zone][name] || (deck[zone][name] = 0);
        deck[zone][name]++;
      });
    });

    App.send('hash', deck)

    return this.gen[filetype].call(this, deck, codes);
  },

  gen: {
    cod(deck) {
      var fn = zone => {
        var arr = [];
        for (var name in zone)
          arr.push(`    <card number="${zone[name]}" name="${name}"/>`);
        return arr.join('\n');
      };

      var data = `<?xml version="1.0" encoding="UTF-8"?>
<cockatrice_deck version="1">
  <deckname>${App.state.filename}</deckname>
  <zone name="main">
${fn(deck.main)}
  </zone>
  <zone name="side">
${fn(deck.side)}
  </zone>
</cockatrice_deck>`;
      return data;
    },

    json(deck) {
      return JSON.stringify(deck, null, 2);
    },

    mwdeck(deck, codes) {
      var data = [];
      var code, name, prefix, zone, zoneName;
      for (zoneName in deck) {
        prefix = zoneName === 'side' ? 'SB: ' : '';
        zone = deck[zoneName];
        for (name in zone) {
          code = codes[name];
          name = name.replace(' // ', '/');
          data.push(prefix + zone[name] + ' [' + code + '] ' + name);
        }
      }
      return data.join('\n');
    },

    txt(deck) {
      var _deck = {}
      ZONES.forEach(zoneName => {
        _deck[zoneName] = []
        var zone = deck[zoneName]
        for (var card in zone)
          _deck[zoneName].push(zone[card] + ' ' + card)
      })
      return _deck.main.join('\n') + '\nSideboard\n' + _deck.side.join('\n')
    }
  },

  render() {
    var {pack} = this.state
    if (pack.length)
      pack = GridRow({ zone: pack, zoneName: 'pack' })
    var pool = App.state.columns ? Cols : Grid

    if (App.state.chat)
      var className = 'chat'

    return d.div({ className, id: 'game' },
      d.audio({
        ref: 'audio',
        src: '/beep.wav'}),
      Chat(this.state),
      Settings(this.state),
      Stats(this.state),
      pack,
      pool(this.state))
  }
});

var Settings = React.createClass({
  render() {
    var sort = ['cmc', 'color', 'rarity', 'type'].map(x =>
      d.button({
        onClick: App.change('sort'),
        disabled: App.state.sort === x},
        x))
    var zone = ZONES.map(x =>
      d.label({},
        d.input({
          type: 'radio',
          name: 'zone',
          value: x,
          checked: App.state.zone === x,
          onChange: App.e('changeZone')}),
        x))

    var lands = {};
    ZONES.forEach(zoneName => {
      lands[zoneName] = ['w', 'u', 'b', 'r', 'g'].map(x =>
        d.td({},
          d.input({
            type: 'number',
            min: 0,
            value: this.props.land[zoneName][x],
            onChange: App.e('changeLand', x, zoneName)})))})

    var direction = App.state.chat ? 'right' : 'left'
    return d.div({ className: 'settings' },
      d.div({},
        d.label({ className: `icon ion-arrow-${direction}-b` },
          d.input({
            hidden: true,
            checked: App.state.chat,
            type: 'checkbox',
            onChange: App.change('chat')
          }))),
      d.table({},
        d.tbody({},
          d.tr({},
            d.td(),
            d.td({}, d.img({ src: 'http://mtgimage.com/symbol/mana/w.svg' })),
            d.td({}, d.img({ src: 'http://mtgimage.com/symbol/mana/u.svg' })),
            d.td({}, d.img({ src: 'http://mtgimage.com/symbol/mana/b.svg' })),
            d.td({}, d.img({ src: 'http://mtgimage.com/symbol/mana/r.svg' })),
            d.td({}, d.img({ src: 'http://mtgimage.com/symbol/mana/g.svg' }))),
          d.tr({},
            d.td({}, 'main'),
            lands.main),
          d.tr({},
            d.td({}, 'side'),
            lands.side))),
      d.div({},
        d.button({
          disabled: this.props.round !== -1,
          onClick: App.e('download')},
          'download'),
        d.input({
          placeholder: 'filename',
          value: App.state.filename,
          onChange: App.change('filename')}),
        d.select({
          value: App.state.filetype,
          onChange: App.change('filetype')},
          d.option({}, 'cod'),
          d.option({}, 'json'),
          d.option({}, 'mwdeck'),
          d.option({}, 'txt'))),
      d.div({},
        d.button({
          disabled: this.props.round !== -1,
          onClick: App.e('copy', this.refs.decklist)},
          'copy'),
        d.textarea({
          placeholder: 'decklist',
          ref: 'decklist',
          readOnly: true,
          value: this.props.decklist})),
      d.div({},
        'add cards to',
        zone),
      d.div({},
        d.label({},
          'column view',
          d.input({
            type: 'checkbox',
            checked: App.state.columns,
            onChange: App.change('columns')}))),
      d.div({},
        d.label({},
          'beep when receiving packs',
          d.input({
            type: 'checkbox',
            checked: App.state.beep,
            onChange: App.change('beep')}))),
      d.div({}, sort))
  }
});

var Stats = React.createClass({
  getInitialState() {
    return {
      edit: false
    };
  },

  click() {
    this.setState({ edit: true }, () =>
      this.refs.nameEl.getDOMNode().focus()
    );
  },

  _edit() {
    this.setState({ edit: true }, ()=>
      this.refs.name.getDOMNode().focus())
  },
  _name(e) {
    e.preventDefault()

    this.setState({ edit: false })
    var name = this.refs.name.getDOMNode().value.slice(0, 15)

    if (!name || name === App.state.name)
      return

    App.save('name', name)
    App.send('name', name)
  },

  render() {
    var {players, self} = this.props;
    var {length} = players
    if (!(length % 2))
      var opp = (self + length / 2) % length
    players = players.map((p, i) => {
      if (i === self)
        var className = 'self'
      else if (i === opp)
        className = 'opponent'

      if (i === self) {
        if (this.state.edit)
          var content = d.form({ onSubmit: this._name },
            d.input({ ref: 'name', defaultValue: p.name}))
        else
          content = d.a({ href: 'javascript:;' }, p.name)
        var td = d.td({ onClick: this._edit }, content)
      } else
        td = d.td({}, p.name)

      if (this.props.isHost)
        var kicker = d.td({},
            d.button({
              onClick: App.e('kick', i)},
              'X'))

      return d.tr({
        className: className},
        kicker,
        d.td({}, i + 1),
        td,
        d.td({}, p.packs),
        d.td({}, p.time),
        d.td({}, p.hash && p.hash.cock),
        d.td({}, p.hash && p.hash.mws))
    })

    return d.div({},
      d.div({}, d.strong({}, this.props.title)),
      d.div({
        hidden: this.props.round || !this.props.isHost},
        d.button({
          onClick: App.e('start')},
          'start'),
        d.label({},
          'add bots',
          d.input({
            type: 'checkbox',
            checked: App.state.bots,
            onChange: App.change('bots')}))),
      d.table({}, d.tbody({
        id: 'stats'},
        d.tr({},
          this.props.isHost && d.th({}, 'kick'),
          d.th({}, '#'),
          d.th({}, 'name'),
          d.th({}, 'packs'),
          d.th({}, 'time'),
          d.th({}, 'cock'),
          d.th({}, 'mws')),
        players)))
  }
});

var RARITIES = {
  'special': 0,
  'mythic': 1,
  'rare': 2,
  'uncommon': 3,
  'common': 4,
  'basic': 5
}

var GridRow = React.createClass({
  sort(a, b) {
    var {sort} = App.state

    var _a = a[sort]
    var _b = b[sort]
    if (sort === 'rarity') {
      _a = RARITIES[_a]
      _b = RARITIES[_b]
    }

    if (_a < _b)
      return -1;
    if (_a > _b)
      return +1;

    if (a.name < b.name)
      return -1;
    if (a.name > b.name)
      return +1;

    return 0;
  },
  render() {
    var {zone, zoneName} = this.props
    var event = zoneName === 'pack'
      ? 'clickPack'
      : 'clickPool'

    var view = zone.slice().sort(this.sort).map(x =>
      d.img({
        src: x.url,
        onClick: App.e(event, x.name, zoneName)
      }))

    return d.div({className: 'zone'},
      d.h1({}, zoneName + ' ' + zone.length),
      view)
  }
})

var Grid = React.createClass({
  render() {
    var {main, side, junk} = this.props;

    return d.div({},
      GridRow({ zone: main, zoneName: 'main' }),
      GridRow({ zone: side, zoneName: 'side' }),
      GridRow({ zone: junk, zoneName: 'junk' }))
  }
});

var Cols = React.createClass({
  getInitialState() {
    return { hidden: true }
  },

  group(arr, attr) {
    var o = {}
    arr.forEach(x => {
      var key = x[attr]
      o[key] || (o[key] = [])
      o[key].push(x)
    })
    for (var key in o)
      o[key].sort(this.sort)
    return o
  },
  sort(a, b) {
    if (a.name < b.name)
      return -1
    if (a.name > b.name)
      return +1

    return 0
  },
  keys(pool) {
    var {sort} = App.state
    var keys = Object.keys(pool)
    switch (sort) {
    case 'color':
      keys = ['colorless', 'white', 'blue', 'black', 'red', 'green', 'multicolor']
        .filter(key => keys.indexOf(key) > -1)
      break
    case 'rarity':
      keys = ['basic', 'common', 'uncommon', 'rare', 'mythic', 'special']
        .filter(key => keys.indexOf(key) > -1)
      break
    case 'cmc':
      keys = keys.filter(key => {
        if (parseInt(key) < 7)
          return true
        pool['6'] || (pool['6'] = [])
        pool['6'] = pool['6'].concat(pool[key])
      })
    default:
      keys = keys.sort()
    }
    return keys
  },

  enter(url, e) {
    var edge = document.documentElement.clientWidth - 240
    var {right} = e.target.getBoundingClientRect()
    if (right > edge) {
      var left = 0
      right = null
    } else {
      left = null
      right = 0
    }
    var style = { left, right }
    this.setState({ url, style, hidden: false })
  },
  hide() {
    this.setState({ hidden: true })
  },

  view(pool, zoneName) {
    var {sort} = App.state
    var {length} = pool
    pool = this.group(pool, sort)

    var cols = this.keys(pool).map(key => {
      var list = pool[key].map((x, i) =>
        d.div({
          className: x.color,
          onMouseOver: this.enter.bind(null, x.url),
          onClick: App.e('clickPool', x.name, zoneName)},
          x.name))
      return d.div({ className: 'col' },
        list.length + ' - ' + key,
        list)
    })

    return d.div({className: 'zone'},
      d.h1({}, zoneName + ' ' + length),
      cols
    )
  },

  render() {
    var {main, side, junk} = this.props
    main = this.view(main, 'main')
    side = this.view(side, 'side')
    junk = this.view(junk, 'junk')

    var {hidden, url, style} = this.state
    var img = d.img({ style, hidden,
      onMouseEnter: this.hide,
      id: 'preview',
      src: url})

    return d.div({},
        img,
        main,
        side,
        junk)
  }
})
