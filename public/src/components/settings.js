import App from '../app'
import {BASICS, Zones} from '../cards'
import {RBox} from './checkbox'
let d = React.DOM

function Lands() {
  let symbols = 'wubrg'.split('').map(x =>
    d.td({},
      d.img({ src: `http://mtgimage.com/symbol/mana/${x}.svg` })))

  let [main, side] = ['main', 'side'].map(zoneName => {
    let inputs = BASICS.map(cardName =>
      d.td({},
        d.input({
          min: 0,
          onChange: App._emit('land', zoneName, cardName),
          type: 'number',
          value: Zones[zoneName][cardName] || 0
        })))

    return d.tr({},
      d.td({}, zoneName),
      inputs)
  })

  return d.table({},
    d.tr({},
      d.td(),
      symbols),
    main,
    side)
}

function Sort() {
  return d.div({},
    ['cmc', 'color', 'type', 'rarity'].map(sort =>
      d.button({
        disabled: sort === App.state.sort,
        onClick: App._save('sort', sort)
      }, sort)))
}

function Download() {
  let filetypes = ['cod', 'json', 'mwdeck', 'txt'].map(filetype =>
    d.option({}, filetype))
  let select = d.select({ valueLink: App.link('filetype') }, filetypes)

  return d.div({},
    d.button({ onClick: App._emit('download') }, 'download'),
    d.input({ placeholder: 'filename', valueLink: App.link('filename') }),
    select)
}

export default React.createClass({
  render() {
    return d.div({ id: 'settings' },
      RBox('chat', 'chat'),
      Lands(),
      Download(),
      this.Copy(),
      RBox('side', 'add cards to side'),
      RBox('beep', 'beep for new packs'),
      RBox('cols', 'column view'),
      Sort())
  },
  Copy() {
    return d.div({},
      d.button({
        onClick: App._emit('copy', this.refs.decklist)
      }, 'copy'),
      d.textarea({
        placeholder: 'decklist',
        ref: 'decklist',
        readOnly: true
      }))
  }
})
