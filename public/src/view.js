var View = React.createClass({
  componentWillMount() {
    App.on('update', this.forceUpdate.bind(this))
  },
  render() {
    return App.state.component;
  }
});
