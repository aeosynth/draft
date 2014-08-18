var View = React.createClass({
  componentDidMount() {
    App.update = this.setState.bind(this, {})
  },
  render() {
    return App.state.component;
  }
});
