var View = React.createClass({
  componentWillMount() {
    App
      .on('update', this.forceUpdate.bind(this))
      .on('route', this.route)
      .route()
      ;
  },
  route(component) {
    this.setState({ component });
  },
  render() {
    return this.state.component;
  }
});
