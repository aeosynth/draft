/** @jsx React.DOM */
var App = React.createClass({
  getInitialState() {
    return { err: null };
  },
  componentWillMount() {
    this.route();
    addEventListener('hashchange', this.route);
    console.log('%chttps://github.com/aeosynth/draft', 'font-size:20pt');
  },
  setErr(err) {
    this.setState({ err });
    location.hash = '';
  },
  route() {
    var hash = location.hash.slice(1);
    var state = {};
    if (hash === 'help')
      component = Help;
    else if (hash.slice(0,2) === 'q/') {
      component = Game;
      state.room = hash.slice(2);
    }
    else {
      component = Lobby;
      if (hash)
        state.err = `room ${hash} not found`;
    }
    state.component = component;

    this.setState(state);
  },
  render() {
    var {setErr} = this;
    var {err, room} = this.state;
    return this.state.component({ err, setErr, room });
  }
});

React.renderComponent(<App />, document.body);
