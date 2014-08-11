var d = React.DOM

var Lobby = React.createClass({
  render() {
    return d.div({},
      d.a({href:'https://github.com/aeosynth/draft'}, d.img({id: 'github', src:'https://camo.githubusercontent.com/38ef81f8aca64bb9a64448d0d70f1308ef5341ab/68747470733a2f2f73332e616d617a6f6e6177732e636f6d2f6769746875622f726962626f6e732f666f726b6d655f72696768745f6461726b626c75655f3132313632312e706e67', alt:'Fork me on GitHub', 'data-canonical-src':'https://s3.amazonaws.com/github/ribbons/forkme_right_darkblue_121621.png'})),
      Chat(),
      d.h1({}, 'drafts.in'),
      d.div({}, d.small({}, 'unaffiliated with wizards of the coast')),
      Create(),
      d.p({className: 'err'}, App.state.err)
    )
  }
});

var Chat = React.createClass({
  getInitialState() {
    return {
      messages: []
    };
  },

  componentDidMount() {
    this.refs.chat.getDOMNode().focus();
    App.on('say', this.hear)
    App.on('set', this.setState.bind(this))
    App.send('join', 'lobby')
  },

  componentWillUnmount() {
    App.off('say', this.hear)
    App.off('set')
  },

  hear(msg) {
    var messages = this.state.messages.concat(msg);
    this.setState({ messages });
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

    if (text[0] !== '/')
      return App.send('say', text)

    var match = text.match(/^\/nick (\S+)/);
    var text = match ?
      `hello, ${match[1]}` :
      'only /nick is supported';

    App.send('say', {
      time: Date.now(),
      name: '',
      text
    });

    if (match)
      App.save('name', match[1]);
  },

  render() {
    var {pad} = this;
    var messages = this.state.messages.map(x => {
      if (!x)
        return null
      var date = new Date(x.time);
      var time = pad(date.getHours()) + ':' + pad(date.getMinutes());

      return d.div({},
        d.span({className:'time'}, time),
        ' ',
        d.span({className:'name'}, x.name),
        ' ',
        x.text)
    });

    return d.div({id:'chat'},
      messages,
      d.input({ref:'name', placeholder:'name'}),
      d.form({onSubmit:this.submit},
        d.input({ref:'chat', placeholder:'chat'})))
  }
});

var Create = React.createClass({
  start() {
    var {id, seats, type} = App.state;
    seats = Number(seats)
    var opts = { id, seats, type };

    if (/cube/.test(type)) {
      var {list, cards, packs} = App.state;
      cards = Number(cards);
      packs = Number(packs);

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

    App.send('create', opts);
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
          opts.push(d.option({value:type[setName]}, setName))
        groups.push(d.optgroup({label:typeName}, opts))
      }
      return d.select({
        onChange: App.change('sets', i),
        value: selectedSet},
        groups)
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

    var cube = d.div({},
      d.div({}, 'enter one card per line'),
      d.textarea({
        value: list,
        onChange: App.change('list')}))

    var cardsEl = this.seq(15, 8).map(x => d.option({}, x))
    var packsEl = this.seq(5,  3).map(x => d.option({}, x))

    switch(type) {
      case 'draft': return d.div({}, setsTop)
      case 'sealed': return d.div({},
        d.div({}, setsTop),
        d.div({}, setsBot))
      case 'cube draft': return d.div({},
        cube,
        d.select({
          onChange: App.change('cards'),
          value: cards},
          cardsEl),
        'cards',
        d.select({
          onChange: App.change('packs'),
          value: packs},
          packsEl),
        'packs')
      case 'cube sealed': return d.div({}, cube)
    }
  },

  render() {
    var {type} = App.state;
    var typeEl = ['draft', 'sealed', 'cube draft', 'cube sealed'].map(x =>
      d.button({
        disabled: x === type,
        onClick: App.change('type')},
        x))

    var seats = this.seq(8, 2).map(x => d.option({}, x))

    return d.div({},
        d.div({},
          d.button({
            onClick: this.start},
            'create'),
          'room for',
          d.select({
            onChange: App.change('seats'),
            value: App.state.seats},
            seats),
          d.a({
            href: '#help'},
            'help')),
        d.div({}, typeEl),
        this.getTab())
  }
});
