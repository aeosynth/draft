import _ from '../../lib/utils'
import App from '../app'
import {getZone} from '../cards'
let d = React.DOM

export default React.createClass({
  render() {
    let zones = this.props.zones.map(zone)
    return d.div({}, zones)
  }
})

function zone(zoneName) {
  let zone = getZone(zoneName)
  let values = _.values(zone)
  let cards = _.flat(values)

  let isAutopickable = card => zoneName === 'pack' && card.isAutopick

  let items = cards.map(card =>
    d.span(
      {
        className: `card ${isAutopickable(card) ? 'autopick-card' : ''}`,
        title: isAutopickable(card) ? 'This card will be automatically picked if your time expires.' : '',
        onClick: App._emit('click', zoneName, card.name),
      },
      d.img({
        src: card.url,
        alt: card.name,
      })))

  return d.div({ className: 'zone' },
    d.h1({}, `${zoneName} ${cards.length}`),
    items)
}
