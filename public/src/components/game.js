import App from '../app'
import {Zones} from '../cards'

import Chat from './chat'
import Cols from './cols'
import Grid from './grid'
import Settings from './settings'
import {LBox} from './checkbox'
let d = React.DOM

const READY_TITLE_TEXT = 'The host may start the game once all users have clicked the "ready" checkbox.'

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

    let readyToStart = App.state.players.every(x => x.isReadyToStart)
    let startButton
      = readyToStart
      ? d.button({ onClick: App._emit('start') }, 'start')
      : d.button({ disabled: true, title: READY_TITLE_TEXT }, 'start')

    return d.div({},
      d.div({}, startButton),
      LBox('bots', 'bots'),
      LBox('timer', 'timer'))
  },
  Players() {
    let rows = App.state.players.map(row)
    let columns = [
      d.th({}, '#'),
      d.th({}, ''), // connection status
      d.th({}, 'name'),
      d.th({}, 'packs'),
      d.th({}, 'time'),
      d.th({}, 'cock'),
      d.th({}, 'mws'),
    ]

    if (!App.state.round)
      columns.push(d.th({ title: READY_TITLE_TEXT }, 'ready'))

    if (App.state.isHost)
      columns.push(d.th({})) // kick

    return d.table({ id: 'players' },
      d.tr({}, ...columns),
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

  let connectionStatusIndicator
    = p.isBot ? d.span({
        className: 'icon-bot',
        title: 'This player is a bot.',
      })
    : p.isConnected ? d.span({
        className: 'icon-connected',
        title: 'This player is currently connected to the server.',
      })
    : d.span({
        className: 'icon-disconnected',
        title: 'This player is currently disconnected from the server.',
      })

  let readyCheckbox
    = i === self ? d.input({
        checked: p.isReadyToStart,
        onChange: App._emit('readyToStart'),
        type: 'checkbox',
      })
    : d.input({
        checked: p.isReadyToStart,
        disabled: true,
        type: 'checkbox',
      })

  let columns = [
    d.td({}, i + 1),
    d.td({}, connectionStatusIndicator),
    d.td({}, p.name),
    d.td({}, p.packs),
    d.td({}, p.time),
    d.td({}, p.hash && p.hash.cock),
    d.td({}, p.hash && p.hash.mws),
  ]

  if (!App.state.round)
    columns.push(d.td({
      className: 'ready',
      title: READY_TITLE_TEXT
    }, readyCheckbox))

  if (App.state.isHost)
    if (i !== self && !p.isBot)
      columns.push(d.td({}, d.button({
        onClick: ()=> App.send('kick', i),
      }, 'kick')))
    else
      columns.push(d.td({}))

  return d.tr({ className }, ...columns)
}

function decrement() {
  for (let p of App.state.players)
    if (p.time)
      p.time--
  App.update()
}
