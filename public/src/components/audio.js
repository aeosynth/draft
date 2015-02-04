let d = React.DOM

export default React.createClass({
  render() {
    return d.audio({ id : 'beep', src : '/media/beep.wav'})
  }
})
