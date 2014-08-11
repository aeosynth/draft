var Help = React.createClass({
  render() {
    return React.DOM.div({
      dangerouslySetInnerHTML: {
        __html: App.helpHTML
      }
    })
  }
})
