var Chat = React.createClass({
  componentDidMount() {
    this.refs.chat.getDOMNode().focus();
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
    var messages = this.props.messages.map(x => {
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
