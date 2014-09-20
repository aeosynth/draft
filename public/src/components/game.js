import App from '../app'
import {Zones} from '../cards'

import Chat from './chat'
import Cols from './cols'
import Grid from './grid'
import Settings from './settings'
import {LBox} from './checkbox'
var d = React.DOM

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
    var {chat} = App.state
    if (chat)
      var className = 'chat'

    return d.div({ className },
      Chat({ hidden: !chat }),
      Settings(),
      this.Start(),
      d.div({}, App.state.title),
      this.Players(),
      this.Cards())
  },

  Cards() {
    if (Object.keys(Zones.pack).length)
      var pack = Grid({ zones: ['pack'] })
    var component = App.state.cols ? Cols : Grid
    var pool = component({ zones: ['main', 'side', 'junk'] })
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
    var rows = App.state.players.map(row)
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
  var {players, self} = App.state
  var {length} = players

  if (length % 2 === 0)
    var opp = (self + length/2) % length

  var className
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
  for (var p of App.state.players)
    if (p.time)
      p.time--
  App.update()
}
