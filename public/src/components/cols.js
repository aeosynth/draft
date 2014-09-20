import App from '../app'
import {getZone} from '../cards'
var d = React.DOM

export default React.createClass({
  getInitialState() {
    return {
      className: 'right',
      url: 'http://mtgimage.com/card/cardback.jpg'
    }
  },
  render() {
    var zones = this.props.zones.map(this.zone)
    var img = d.img({
      className: this.state.className,
      id: 'img',
      onMouseEnter: this.enter.bind(this, this.state.url),
      src: this.state.url
    })
    return d.div({}, zones, img)
  },

  enter(url, e) {
    var {offsetLeft} = e.target
    var {clientWidth} = document.documentElement

    var imgWidth = 240
    var colWidth = 180

    var className = offsetLeft + colWidth > clientWidth - imgWidth
      ? 'left'
      : 'right'

    this.setState({ url, className })
  },
  zone(zoneName) {
    var zone = getZone(zoneName)

    var sum = 0
    var cols = []
    for (var key in zone) {
      var items = zone[key].map(card =>
        d.div({
          className: card.color,
          onClick: App._emit('click', zoneName, card.name),
          onMouseEnter: this.enter.bind(this, card.url)
        }, card.name))

      sum += items.length
      cols.push(d.div({ className: 'col' },
        d.div({}, `${items.length} - ${key}`),
        items))
    }

    return d.div({ className: 'zone' },
      d.h1({}, `${zoneName} ${sum}`),
      cols)
  }
})
