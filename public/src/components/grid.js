import _ from '../../lib/utils'
import App from '../app'
import {getZone} from '../cards'
var d = React.DOM

export default React.createClass({
  render() {
    var zones = this.props.zones.map(zone)
    return d.div({}, zones)
  }
})

function zone(zoneName) {
  var zone = getZone(zoneName)
  var values = _.values(zone)
  var cards = _.flat(values)

  var items = cards.map(card =>
    d.img({
      onClick: App._emit('click', zoneName, card.name),
      src: card.url
    }))

  return d.div({ className: 'zone' },
    d.h1({}, `${zoneName} ${cards.length}`),
    items)
}
