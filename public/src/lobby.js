/** @jsx React.DOM */
var Lobby = React.createClass({
  render() {
    return <div>
      <Chat />
      <h1>drafts.in</h1>
      <div><small>unaffiliated with wizards of the coast</small></div>
      <Create setErr={this.props.setErr} err={this.props.err}/>
    </div>;
  }
});

var Chat = React.createClass({
  getInitialState() {
    var name = 'newfriend';
    try {
      name = JSON.parse(localStorage.name);
    } catch(err) {}

    return {
      items: [],
      name
    };
  },

  componentDidMount() {
    var fire = this.fire = new Firebase('https://draft.firebaseio.com/');
    fire
      .limit(15)
      .on('child_added', this.add)
    ;
    this.refs.chat.getDOMNode().focus();
  },

  componentWillUnmount() {
    Firebase.goOffline();
  },

  change(key) {
    return {target} => {
      var val;
      switch(target.type) {
        case 'submit':
          val = target.textContent;
          break;
        default:
          val = target.value;
      }
      this.set(key, val);
    };
  },

  add(snapshot) {
    var val = snapshot.val();
    this.state.items.push(val);
    this.forceUpdate();
  },

  pad(n) {
    return n < 10 ? '0' + n : n;
  },

  submit(e) {
    e.preventDefault();

    var el = this.refs.chat.getDOMNode();
    var text = el.value.trim().slice(0, 1e3);
    if (!text) return;
    el.value = '';

    this.fire.push({
      time: Firebase.ServerValue.TIMESTAMP,
      name: this.state.name,
      text
    });
  },

  render() {
    var {pad} = this;
    var items = this.state.items.map(x => {
      var date = new Date(x.time);
      var time = pad(date.getHours()) + ':' + pad(date.getMinutes());
      return <div>
        <span className="time">{time}</span>&nbsp;
        <span className="name">{x.name}</span>&nbsp;
        {x.text}
      </div>;
    });

    return <div id="chat">
      {items}
        <input ref="name" placeholder="name" />
      <form onSubmit={this.submit}>
        <input ref="chat" placeholder="chat" />
      </form>
    </div>;
  }
});

var Create = React.createClass({
  getInitialState() {
    var {id} = localStorage;
    if (!id)
      localStorage.id = id = Math.random(9e9).toString(32);

    var state = {
      id
    };

    var defaults = {
      list: '',
      cards: 15,
      packs: 3,

      type: 'sealed',
      seats: 8,
      sets: [
        'M15',
        'M15',
        'M15',
        'M15',
        'M15',
        'M15'
      ]
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

  onload(e) {
    var {status, response} = e.target;
    if (status !== 200)
      return this.props.setErr(response);

    location.hash = 'q/' + response;
  },

  start() {
    var x = new XMLHttpRequest;
    x.open('post', '/create');
    x.setRequestHeader('Content-Type', 'application/json');
    x.onload = this.onload;

    var {id, seats, type} = this.state;
    var opts = { id, seats, type };

    if (/cube/.test(type)) {
      var {list, cards, packs} = this.state;

      list = list
        .split('\n')
        .map(x => x.trim())
        .filter(x => x.length)
        ;

      cards = cards;
      packs = packs;

      opts.cube = { list, cards, packs };
    }
    else {
      var {sets} = this.state;
      if (type === 'draft')
        sets = sets.slice(0, 3);
      opts.sets = sets;
    }

    x.send(JSON.stringify(opts));
  },

  change(key) {
    return {target} => {
      var val;
      switch(target.type) {
        case 'submit':
          val = target.textContent;
          break;
        default:
          val = target.value;
      }
      this.set(key, val);
    };
  },

  set(key, val) {
    var obj = {};
    obj[key] = val;
    this.setState(obj);
    localStorage[key] = JSON.stringify(val);
  },

  changeSet(index) {
    return e => {
      var {sets} = this.state;
      sets[index] = e.target.value;
      this.set('sets', sets);
    };
  },

  genSets() {
    var {sets} = this.state;
    return sets.map((selectedSet, i) => {
      var groups = [];
      var type, typeName, opts, setName;
      for (typeName in SETS) {
        opts = [];
        type = SETS[typeName];
        for (setName in type)
          opts.push(<option value={type[setName]}>{setName}</option>);
        groups.push(<optgroup label={typeName}>{opts}</optgroup>);
      }
      return (
        <select
          onChange={this.changeSet(i)}
          value={selectedSet}
        >{groups}</select>
      );
    });
  },

  seq(i, stop) {
    var arr = [];
    while (i >= stop)
      arr.push(i--);
    return arr;
  },

  getTab() {
    var {list, cards, packs, type} = this.state;

    var sets = this.genSets();
    var setsTop = sets.slice(0, 3);
    var setsBot = sets.slice(3);

    var cube = <div>
      <div>enter one card per line</div>
      <textarea value={list} onChange={this.change('list')}></textarea>
    </div>;
    var cardsEl = this.seq(15, 8).map(x => <option>{x}</option>);
    var packsEl = this.seq(5,  3).map(x => <option>{x}</option>);

    switch(type) {
      case 'draft': return <div>
        {setsTop}
      </div>;
      case 'sealed': return <div>
        <div>{setsTop}</div>
        <div>{setsBot}</div>
      </div>;
      case 'cube draft': return <div>
        {cube}
        <select
          onChange={this.change('cards')}
          value={cards}
        >{cardsEl}</select>
        cards,
        <select
          onChange={this.change('packs')}
          value={packs}
        >{packsEl}</select>
        packs
      </div>;
      case 'cube sealed': return <div>
        {cube}
      </div>;
    }
  },

  render() {
    var {type} = this.state;
    var typeEl = ['draft', 'sealed', 'cube draft', 'cube sealed'].map(x =>
      <button
        disabled={x === type}
        onClick={this.change('type')}
        >{x}</button>);

    var seats = this.seq(8, 2).map(x => <option>{x}</option>);

    return <div>
      <div>
        <button onClick={this.start}>create</button>
        room for
        <select
          onChange={this.change('seats')}
          value={this.state.seats}
          >{seats}
        </select>
        <a href="#help">help</a>
      </div>
      <div>
        {typeEl}
      </div>
      {this.getTab()}
      <p className="err">{this.props.err}</p>
    </div>;
  }
});
