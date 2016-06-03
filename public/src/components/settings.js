import App from '../app'
import {BASICS, Zones} from '../cards'
import {RBox} from './checkbox'
let d = React.DOM

function Lands() {
  let colors = ['White', 'Blue', 'Black', 'Red', 'Green']
  let symbols = colors.map(x =>
    d.td({},
      d.img({ src: `http://www.wizards.com/Magic/redesign/${x}_Mana.png` })))

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

  let suggest = d.tr({},
    d.td({}, 'deck size'),
    d.td({}, d.input({
      min: 0,
      onChange: App._emit('deckSize'),
      type: 'number',
      value: App.state.deckSize,
    })),
    d.td({ colSpan: 2 }, d.button({
      onClick: App._emit('resetLands')
    }, 'reset lands')),
    d.td({colSpan: 2 }, d.button({
      onClick: App._emit('suggestLands')
    }, 'suggest lands')))

  return d.table({},
    d.tr({},
      d.td(),
      symbols),
    main,
    side,
    suggest)
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
      this.Side(),
      RBox('beep', 'beep for new packs'),
      RBox('cols', 'column view'),
      Sort())
  },
  SideCB(e) {
    let side = e.target.checked
    App.save('side', side)
    App.emit('side')
  },
  Side() {
    return d.div({},
      d.label({},
        'add cards to side ',
        d.input({
          checked: App.state.side,
          onChange: this.SideCB,
          type: 'checkbox'
        })))
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
