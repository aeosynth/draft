/** @jsx React.DOM */
var Lobby = React.createClass({
  render() {
    return <div>
      <a href="https://github.com/aeosynth/draft"><img id="github" src="https://camo.githubusercontent.com/38ef81f8aca64bb9a64448d0d70f1308ef5341ab/68747470733a2f2f73332e616d617a6f6e6177732e636f6d2f6769746875622f726962626f6e732f666f726b6d655f72696768745f6461726b626c75655f3132313632312e706e67" alt="Fork me on GitHub" data-canonical-src="https://s3.amazonaws.com/github/ribbons/forkme_right_darkblue_121621.png"/></a>
      <Chat/>
      <h1>drafts.in</h1>
      <div><small>unaffiliated with wizards of the coast</small></div>
      <Create/>
      <p className="err">{this.props.err}</p>
    </div>;
  }
});

var Chat = React.createClass({
  getInitialState() {
    return {
      items: []
    };
  },

  componentDidMount() {
    this.fire = new Firebase('https://draft.firebaseio.com/');
    this.fire
      .limit(15)
      .on('child_added', this.add)
    ;
    this.refs.chat.getDOMNode().focus();
  },

  componentWillUnmount() {
    Firebase.goOffline();
  },

  add(snapshot) {
    var val = snapshot.val();
    var items = this.state.items.concat(val);
    this.setState({ items });
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
      name: App.state.name,
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
  onload(e) {
    var {status, response} = e.target;
    if (status !== 200)
      return App.err(response);

    location.hash = 'q/' + response;
  },

  start() {
    var x = new XMLHttpRequest;
    x.open('post', '/create');
    x.setRequestHeader('Content-Type', 'application/json');
    x.onload = this.onload;

    var {id, seats, type} = App.state;
    var opts = { id, seats, type };

    if (/cube/.test(type)) {
      var {list, cards, packs} = App.state;

      list = list
        .split('\n')
        .map(x => x.trim())
        .filter(x => x.length)
        ;

      var min = type === 'cube draft' ?
        seats * cards * packs :
        seats * 90;
      if ((list.length < min) || (1e3 < list.length))
        return App.err('this cube needs between ' + min +
            ' and 1000 cards; it has ' + list.length);

      opts.cube = { list, cards, packs };
    }
    else {
      var {sets} = App.state;
      if (type === 'draft')
        sets = sets.slice(0, 3);
      opts.sets = sets;
    }

    x.send(JSON.stringify(opts));
  },

  genSets() {
    var {sets} = App.state;
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
          onChange={App.change('sets', i)}
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
    var {list, cards, packs, type} = App.state;

    var sets = this.genSets();
    var setsTop = sets.slice(0, 3);
    var setsBot = sets.slice(3);

    var cube = <div>
      <div>enter one card per line</div>
      <textarea
        value={list}
        onChange={App.change('list')}
      ></textarea>
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
          onChange={App.change('cards')}
          value={cards}
        >{cardsEl}</select>
        cards,
        <select
          onChange={App.change('packs')}
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
    var {type} = App.state;
    var typeEl = ['draft', 'sealed', 'cube draft', 'cube sealed'].map(x =>
      <button
        disabled={x === type}
        onClick={App.change('type')}
        >{x}</button>);

    var seats = this.seq(8, 2).map(x => <option>{x}</option>);

    return <div>
      <div>
        <button onClick={this.start}>create</button>
        room for
        <select
          onChange={App.change('seats')}
          value={App.state.seats}
          >{seats}
        </select>
        <a href="#help">help</a>
      </div>
      <div>
        {typeEl}
      </div>
      {this.getTab()}
    </div>;
  }
});
