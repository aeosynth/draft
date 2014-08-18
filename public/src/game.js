var d = React.DOM
var ZONES = ['main', 'side'];

var Game = React.createClass({
  getInitialState() {
    return {
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
  componentDidMount() {
    this.decrement();

    App.on('join', this.join)
    App.on('add', this.add);
    App.on('set', this.set);

    this.join(this.props.room);
  },
  componentWillUnmount() {
    clearTimeout(this.timeoutID);
    App.off()
  },

  join(room) {
    this.setState(this.getInitialState());
    App.send('join', room);
  },

  add([card, isJunk]) {
    var state = {};
    var zone = isJunk ? 'junk' : App.state.zone
    state[zone] = this.state[zone].concat(card);
    this.setState(state);
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

  decrement() {
    this.state.players.forEach(x => {
      if (x.time)
        x.time--;
    });
    this.forceUpdate();
    this.timeoutID = setTimeout(this.decrement, 1e3);
  },

  lands: {
    w: { cmc: 0, code: 'UNH', color: 'A', rarity: 5, type: 'Land', key: 'w', url: 'http://mtgimage.com/multiverseid/73963.jpg', name: 'Plains'   },
    u: { cmc: 0, code: 'UNH', color: 'A', rarity: 5, type: 'Land', key: 'u', url: 'http://mtgimage.com/multiverseid/73951.jpg', name: 'Island'   },
    b: { cmc: 0, code: 'UNH', color: 'A', rarity: 5, type: 'Land', key: 'b', url: 'http://mtgimage.com/multiverseid/73973.jpg', name: 'Swamp'    },
    r: { cmc: 0, code: 'UNH', color: 'A', rarity: 5, type: 'Land', key: 'r', url: 'http://mtgimage.com/multiverseid/73958.jpg', name: 'Mountain' },
    g: { cmc: 0, code: 'UNH', color: 'A', rarity: 5, type: 'Land', key: 'g', url: 'http://mtgimage.com/multiverseid/73946.jpg', name: 'Forest'   }
  },

  clickPack(index) {
    if (this.state.selected !== index)
      return this.state.selected = index;

    App.send('pick', index);
    this.setState({pack: [], selected: null});
  },

  clickPool(index, zoneName, e) {
    var {land, main, side, junk} = this.state;
    var from = this.state[zoneName];
    var card = from[index];

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

    from.splice(index, 1);
    to.push(card);
    this.setState({ main, side, junk });
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

  resetLand() {
    var land = {};
    ZONES.forEach(zoneName => {
      land[zoneName] = {};
      ['w', 'u', 'b', 'r', 'g'].forEach(color =>
        land[zoneName][color] = 0);
    });
    return land;
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
    return d.div({},
      d.audio({
        ref: 'audio',
        src: '/beep.wav'}),
      Settings({
        change: this.change,
        changeLand: this.changeLand,
        changeZone: this.changeZone,
        download: this.download,
        generate: this.generate,
        set: this.set,

        land: this.state.land,
        round: this.state.round}),
      Stats({
        change: this.change,
        start: this.start,

        isHost: this.state.isHost,
        players: this.state.players,
        round: this.state.round,
        self: this.state.self,
        title: this.state.title}),
      Cards({
        clickPack: this.clickPack,
        clickPool: this.clickPool,

        pack: this.state.pack,
        main: this.state.main,
        side: this.state.side,
        junk: this.state.junk}))
  }
});

var Settings = React.createClass({
  getInitialState() {
    return {
      decklist: ''
    };
  },

  copy() {
    var state = { decklist: this.props.generate('txt') };
    var cb = () => this.refs.decklist.getDOMNode().select();
    this.setState(state, cb);
  },

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
          onChange: this.props.changeZone},
          x)))

    var lands = {};
    ZONES.forEach(zoneName => {
      lands[zoneName] = ['w', 'u', 'b', 'r', 'g'].map(x =>
        d.td({},
          d.input({
            type: 'number',
            min: 0,
            value: this.props.land[zoneName][x],
            onChange: this.props.changeLand.bind(null, x, zoneName)})))})

    return d.div({ className: 'settings' },
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
          onClick: this.props.download},
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
          onClick: this.copy},
          'copy'),
        d.textarea({
          placeholder: 'decklist',
          ref: 'decklist',
          readOnly: true,
          value: this.state.decklist})),
      d.div({},
        'add cards to',
        zone),
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

      return d.tr({
        className: className},
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
          onClick: this.props.start},
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
          d.th({}, '#'),
          d.th({}, 'name'),
          d.th({}, 'packs'),
          d.th({}, 'time'),
          d.th({}, 'cock'),
          d.th({}, 'mws')),
        players)))
  }
});

var Cards = React.createClass({
  sort(arr) {
    var {sort} = App.state;

    return arr.sort((a, b) => {
      if (a[sort] < b[sort])
        return -1;
      if (a[sort] > b[sort])
        return +1;

      if (a.name < b.name)
        return -1;
      if (a.name > b.name)
        return +1;

      return 0;
    });
  },

  show(arr, zone) {
    var cb = zone === 'pack' ?
      this.props.clickPack:
      this.props.clickPool;

    return arr.map((card, i) =>
      d.img({
        onClick: cb.bind(null, i, zone),
        src: card.url}))
  },

  render() {
    var {pack, main, side, junk} = this.props;
    pack = this.show(pack, 'pack');
    main = this.show(this.sort(main), 'main');
    side = this.show(this.sort(side), 'side');
    junk = this.show(this.sort(junk), 'junk');

    return d.div({
      className: 'cards'},
      d.div({
        hidden: !pack.length},
        d.h1({}, 'pack ' + pack.length),
        pack),
      d.div({},
        d.h1({}, 'main ' + main.length),
        main),
      d.div({},
        d.h1({}, 'side ' + side.length),
        side),
      d.div({},
        d.h1({}, 'junk ' + junk.length),
        junk))
  }
});
