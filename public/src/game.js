/** @jsx React.DOM */
var ZONES = ['main', 'side'];

var Game = React.createClass({
  getInitialState() {
    var {id} = localStorage;
    if (!id)
      localStorage.id = id = Math.random(9e9).toString(32);

    var state = {
      id,
      isHost: false,
      selected: null,
      state: 'open',
      cap: '',
      land: this.resetLand(),
      players: [],
      pack: [],
      main: [],
      side: []
    };

    var defaults = {
      beep: false,
      bots: true,
      filename: 'filename',
      filetype: 'dec',
      name: 'newfriend',
      sort: 'color',
      zone: 'main'
    };

    var key, val;
    for (key in defaults) {
      try {
        val = JSON.parse(localStorage[key]);
      } catch(err) {
        val = defaults[key];
      }
      state[key] = val;
    }

    return state;
  },

  join(room) {
    if (this.ws)
      this.ws.close();

    var {id, name} = this.state;
    var options = {
      query: { id, name, room }
    };
    var ws = this.ws = eio('ws://' + location.host, options);
    ws.on('message', (data) => {
      data = JSON.parse(data);
      var {args} = data;
      switch(data.name) {
        case 'add':
          this.state[this.state.zone].push(args);
          this.forceUpdate();
          break;
        case 'error':
          this.props.setErr(args);
          break;
        case 'set':
          if (args.pool) {
            args[this.state.zone] = args.pool;
            delete args.pool;
          }
          if (args.pack && this.state.beep) {
            this.refs.audio.getDOMNode().play();
          }
          this.setState(args);
          break;
      }
    });
    ws.json = function() {
      var args = Array.prototype.slice.call(arguments);
      ws.send(JSON.stringify(args));
    };
  },

  componentDidMount() {
    this.decrement();
    this.join(this.props.room);
  },

  componentDidUpdate(prevProps) {
    var {room} = this.props;
    if (prevProps.room !== room)
      this.join(room);
  },

  componentWillUnmount() {
    this.ws.close();
    clearTimeout(this.timeoutID);
  },

  start() {
    this.ws.json('start', this.state.bots);
    this.setState({ state: 'started' });
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
    w: { key: 'w', cmc: 0, code: 'UNH', color: 'A', rarity: 5, type: 'Basic Land', url: 'http://mtgimage.com/multiverseid/73963.jpg', name: 'Plains'   },
    u: { key: 'u', cmc: 0, code: 'UNH', color: 'A', rarity: 5, type: 'Basic Land', url: 'http://mtgimage.com/multiverseid/73951.jpg', name: 'Island'   },
    b: { key: 'b', cmc: 0, code: 'UNH', color: 'A', rarity: 5, type: 'Basic Land', url: 'http://mtgimage.com/multiverseid/73973.jpg', name: 'Swamp'    },
    r: { key: 'r', cmc: 0, code: 'UNH', color: 'A', rarity: 5, type: 'Basic Land', url: 'http://mtgimage.com/multiverseid/73958.jpg', name: 'Mountain' },
    g: { key: 'g', cmc: 0, code: 'UNH', color: 'A', rarity: 5, type: 'Basic Land', url: 'http://mtgimage.com/multiverseid/73946.jpg', name: 'Forest'   }
  },

  clickPack(index) {
    if (this.state.selected !== index)
      return this.state.selected = index;

    this.ws.json('pick', index);
    this.setState({pack: [], selected: null});
  },

  clickPool(index, zoneName) {
    var {land, main, side} = this.state;
    zoneName === 'main' ?
      (from = main, to = side):
      (from = side, to = main);

    var card = from[index];
    if (card.type === 'Basic Land') {
      var {key} = card;
      land[zoneName][key]--;
      this.setLand(land);
      return;
    }

    from.splice(index, 1);
    to.push(card);
    this.setState({ main, side });
  },

  change(key) {
    return {target} => {
      var val;
      switch (target.type) {
        case 'checkbox': val = target.checked; break;
        case 'submit': val = target.textContent; break;
        default: val = target.value;
      }
      this.set(key, val);
    }
  },

  set(key, val) {
    var obj = {};
    obj[key] = val;
    this.setState(obj);
    localStorage[key] = JSON.stringify(val);
  },

  setLand(land) {
    ZONES.forEach(zoneName => {
      var zone = this.state[zoneName].filter(x => x.type !== 'Basic Land');
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
    var all = main.concat(side).filter(x => x.type !== 'Basic Land');
    value === 'main' ?
      (main = all, side = []) :
      (main = [],  side = all);

    var land = this.resetLand();

    this.setState({ zone: value, land, main, side });
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
    var {filename, filetype} = this.state;

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

    var {players, self} = this.state;
    if (!players[self].hash)
      this.ws.json('hash', deck);

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
  <deckname>${this.state.filename}</deckname>
  <zone name="main">
${fn(deck.main)}
  </zone>
  <zone name="side">
${fn(deck.side)}
  </zone>
</cockatrice_deck>`;
      return data;
    },

    dec(deck) {
      var data = [];
      var name, prefix, zone, zoneName;
      for (zoneName in deck) {
        prefix = zoneName === 'side' ? 'SB: ' : '';
        zone = deck[zoneName];
        for (name in zone)
          data.push(prefix + zone[name] + ' ' + name);
      }
      return data.join('\n');
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

    json(deck) {
      return JSON.stringify(deck, null, 2);
    }
  },

  getCap() {
    this.ws.json('getCap');
  },

  setName(name) {
    this.ws.json('name', name);
    localStorage.name = JSON.stringify(name);
  },

  render() {
    return <div>
      <audio ref="audio" src="/media/beep.wav"></audio>
      <Settings
        change={this.change}
        changeLand={this.changeLand}
        changeZone={this.changeZone}
        download={this.download}
        generate={this.generate}
        getCap={this.getCap}
        set={this.set}

        cap={this.state.cap}
        beep={this.state.beep}
        land={this.state.land}
        filename={this.state.filename}
        filetype={this.state.filetype}
        sort={this.state.sort}
        state={this.state.state}
        zone={this.state.zone}
        />
      <Stats
        change={this.change}
        start={this.start}
        setName={this.setName}

        isHost={this.state.isHost}
        name={this.state.name}
        bots={this.state.bots}
        players={this.state.players}
        self={this.state.self}
        state={this.state.state}
        title={this.state.title}
        />
      <Cards
        pack={this.state.pack}
        main={this.state.main}
        side={this.state.side}
        sort={this.state.sort}
        clickPack={this.clickPack}
        clickPool={this.clickPool}
        />
    </div>;
  }
});

var Settings = React.createClass({
  getInitialState() {
    return {
      decklist: ''
    };
  },

  copy() {
    this.setState({
      decklist: this.props.generate('dec')
    });
  },

  render() {
    var sort = ['cmc', 'color', 'rarity', 'type'].map(x =>
      <button
        onClick={this.props.change('sort')}
        disabled={this.props.sort === x}
        >{x}</button>
    );
    var zone = ZONES.map(x =>
      <label><input
        type="radio"
        name="zone"
        value={x}
        checked={this.props.zone === x}
        onChange={this.props.changeZone}
      >{x}</input></label>
    );

    var lands = {};
    ZONES.forEach(zoneName => {
      lands[zoneName] = ['w', 'u', 'b', 'r', 'g'].map(x =>
        <td><input
          type="number"
          min="0"
          value={this.props.land[zoneName][x]}
          onChange={this.props.changeLand.bind(null, x, zoneName)}
          /></td>
      );
    });

    return <div className="settings">
      <table><tbody>
        <tr>
          <td></td>
          <td><img src="http://mtgimage.com/symbol/mana/w.svg"/></td>
          <td><img src="http://mtgimage.com/symbol/mana/u.svg"/></td>
          <td><img src="http://mtgimage.com/symbol/mana/b.svg"/></td>
          <td><img src="http://mtgimage.com/symbol/mana/r.svg"/></td>
          <td><img src="http://mtgimage.com/symbol/mana/g.svg"/></td>
        </tr>
        <tr>
          <td>main</td>
          {lands.main}
        </tr>
        <tr>
          <td>side</td>
          {lands.side}
        </tr>
      </tbody></table>
      <div>
        <button
          disabled={this.props.state !== 'done'}
          onClick={this.props.download}
          >download
        </button>
        <input placeholder="filename" value={this.props.filename} onChange={this.props.change('filename')}/>
        <select value={this.props.filetype} onChange={this.props.change('filetype')}>
          <option>cod</option>
          <option>dec</option>
          <option>json</option>
          <option>mwdeck</option>
        </select>
      </div>
      <div>
        <button
          disabled={this.props.state !== 'done'}
          onClick={this.copy}
          >decklist
        </button>
        <textarea placeholder="decklist" readOnly value={this.state.decklist}></textarea>
      </div>
      <div>
        <button onClick={this.props.getCap}>draftcap</button>
        <textarea placeholder="draftcap" readOnly value={this.props.cap}></textarea>
      </div>
      <div>
        add cards to: {zone}
      </div>
      <div>
        <label> beep when receiving packs
          <input
            type="checkbox"
            checked={this.props.beep}
            onChange={this.props.change('beep')}
        /></label>
      </div>
      <div>
        {sort}
      </div>
    </div>;
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

  setName(e) {
    e.preventDefault();
    var name = this.refs.nameEl.getDOMNode().value.slice(0, 15);
    this.setState({ edit: false });
    this.props.setName(name);
  },

  render() {
    var {players, self, state} = this.props;
    var opp = (self + 4) % 8;
    players = players.map((p, i) => {
      var className =
        i === self ? 'self' :
        i === opp ? 'opponent' :
        '';

      var td = i === self ?
        <td>
          <span
            className="link"
            hidden={this.state.edit}
            onClick={this.click}
            >{p.name}
          </span>
          <form onSubmit={this.setName}><input
            ref="nameEl"
            hidden={!this.state.edit}
            placeholder="name"
            defaultValue={this.props.name}
          /></form>
        </td> :
        <td>{p.name}</td>;

      return <tr className={className}>
        <td>{i + 1}</td>
        {td}
        <td>{p.packs}</td>
        <td>{p.time}</td>
        <td>{p.hash && p.hash.cock}</td>
        <td>{p.hash && p.hash.mws}</td>
      </tr>;
    });

    return <div>
      <div><strong>{this.props.title}</strong></div>
      <div hidden={(this.props.state !== 'open') || !this.props.isHost}>
        <button onClick={this.props.start}>start</button>
        <label>add bots<input type="checkbox" checked={this.props.bots} onChange={this.props.change('bots')}/></label>
      </div>
      <table><tbody>
        <tr>
          <th>#</th>
          <th>name</th>
          <th>time</th>
          <th>packs</th>
          <th>cockatrice</th>
          <th>mws</th>
        </tr>
        {players}
      </tbody></table>
    </div>;
  }
});

var Cards = React.createClass({
  sort(arr) {
    var {sort} = this.props;

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
      <img
        onClick={cb.bind(null, i, zone)}
        src={card.url}
      />);
  },

  render() {
    var {pack, main, side} = this.props;
    pack = this.show(pack, 'pack');
    main = this.show(this.sort(main), 'main');
    side = this.show(this.sort(side), 'side');

    return <div className="cards">
      <div>
        <h1>pack {pack.length}</h1>
        {pack}
      </div>
      <div>
        <h1>main {main.length}</h1>
        {main}
      </div>
      <div>
        <h1>side {side.length}</h1>
        {side}
      </div>
    </div>;
  }
});
