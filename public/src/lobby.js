var d = React.DOM

var Lobby = React.createClass({
  getInitialState() {
    return {
      messages: []
    };
  },
  componentDidMount() {
    App.send('join', 'lobby')
    for (var event in this.events)
      App.on(event, this.events[event].bind(this))
  },
  componentWillUnmount() {
    App.off()
  },
  events: {
    set(state) {
      this.setState(state)
    },
    hear(msg) {
      var messages = this.state.messages.concat(msg)
      this.setState({ messages })
    },
  },

  render() {
    return d.div({},
      Chat(this.state),
      d.h1({}, 'drafts.in'),
      d.p({className: 'err'}, App.state.err),
      Create(),
      d.footer({},
        d.div({},
          d.a({ className: 'icon ion-social-github', href: 'https://github.com/aeosynth/draft' }),
          d.a({ className: 'icon ion-social-twitter', href: 'https://twitter.com/aeosynth' }),
          d.a({ className: 'icon ion-android-mail', href: 'mailto:james.r.campos@gmail.com' })),
        d.div({},
          d.small({}, 'unaffiliated with wizards of the coast')))
    )
  }
})

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
        .map(x => x
          .trim()
          .replace(/^(\d+.)?\s*/, '')
          .replace(/\s*\/+\s*/g, ' // ')
          .toLowerCase())
        .filter(x => x)

      var min = type === 'cube draft' ?
        seats * cards * packs :
        seats * 90;
      if ((list.length < min) || (1e3 < list.length))
        return App.err('this cube needs between ' + min +
            ' and 1000 cards; it has ' + list.length);

      list = list.join('\n') // easier for server to type check
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
