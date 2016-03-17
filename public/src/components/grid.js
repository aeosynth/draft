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
  let perPileEmission = zoneName === 'pile'

  let emitMaybe = (card) => {
    if (! perPileEmission)
      return App._emit('click', zoneName, card.name)
    return () => {}
  }

  let pileControlsMaybe = () => {
    if (perPileEmission) {
      return d.div({}, 
               d.button({
                 onClick: App._emit('passPile', zoneName, cards)
               }, 'pass pile'),
               d.button({
                 onClick: App._emit('takePile', zoneName, cards)
               }, 'take pile')
             )
    }
    return d.span({})
  }

  let items = cards.map(card =>
    d.img({
      onClick: emitMaybe(card),
      src: card.url,
      alt: card.name
    }))

  return d.div({ className: 'zone' },
    d.h1({}, `${zoneName} ${cards.length}`),
    [pileControlsMaybe(), items])
}
