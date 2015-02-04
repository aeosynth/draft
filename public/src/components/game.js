import App from '../app'
import {Zones} from '../cards'

import Chat from './chat'
import Cols from './cols'
import Grid from './grid'
import Settings from './settings'
import {LBox} from './checkbox'
let d = React.DOM

export default React.createClass({
  componentWillMount() {
    App.state.players = []
    App.send('join', this.props.id)
  },
  componentDidMount() {
    this.timer = window.setInterval(decrement, 1e3)
  },
  componentWillUnmount() {
    window.clearInterval(this.timer)
  },
  componentWillReceiveProps({id}) {
    if (this.props.id === id)
      return

    App.send('join', id)
  },
  render() {
    let {chat} = App.state
    if (chat)
      let className = 'chat'

    return d.div({ className },
      Chat({ hidden: !chat }),
      d.audio({ id: 'beep', src: '/media/beep.wav' }),
      Settings(),
      this.Start(),
      d.div({}, App.state.title),
      this.Players(),
      this.Cards())
  },

  Cards() {
    if (Object.keys(Zones.pack).length)
      let pack = Grid({ zones: ['pack'] })
    let component = App.state.cols ? Cols : Grid
    let pool = component({ zones: ['main', 'side', 'junk'] })
    return [pack, pool]
  },
  Start() {
    if (App.state.round || !App.state.isHost)
      return

    return d.div({},
      d.div({},
        d.button({ onClick: App._emit('start') }, 'start')),
      LBox('bots', 'bots'),
      LBox('timer', 'timer'))
  },
  Players() {
    let rows = App.state.players.map(row)
    return d.table({ id: 'players' },
      d.tr({},
        d.th({}, '#'),
        d.th({}, 'name'),
        d.th({}, 'packs'),
        d.th({}, 'time'),
        d.th({}, 'cock'),
        d.th({}, 'mws')),
      rows)
  }
})

function row(p, i) {
  let {players, self} = App.state
  let {length} = players

  if (length % 2 === 0)
    let opp = (self + length/2) % length

  let className
    = i === self ? 'self'
    : i === opp  ? 'opp'
    : null

  return d.tr({ className },
    d.td({}, i + 1),
    d.td({}, p.name),
    d.td({}, p.packs),
    d.td({}, p.time),
    d.td({}, p.hash && p.hash.cock),
    d.td({}, p.hash && p.hash.mws))
}

function decrement() {
  for (let p of App.state.players)
    if (p.time)
      p.time--
  App.update()
}
