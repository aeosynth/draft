import _ from '../../lib/utils'
import App from '../app'
let d = React.DOM

export default React.createClass({
  getInitialState() {
    return {
      messages: []
    }
  },
  componentDidMount() {
    this.refs.entry.getDOMNode().focus()
    App.on('hear', this.hear)
    App.on('chat', messages => this.setState({ messages }))
  },
  componentWillUnmount() {
    App.off('hear')
    App.off('chat')
  },
  render() {
    // must be mounted to receive messages
    let {hidden} = this.props
    return d.div({ hidden, id: 'chat' },
      d.div({ id: 'messages' },
        this.state.messages.map(this.Message)),
      this.Entry())
  },

  hear(msg) {
    this.state.messages.push(msg)
    this.forceUpdate()
  },
  Message(msg) {
    if (!msg)
      return

    let {time, name, text} = msg
    let date = new Date(time)
    let hours   = _.pad(2, '0', date.getHours())
    let minutes = _.pad(2, '0', date.getMinutes())
    time = `${hours}:${minutes}`

    return d.div({},
      d.time({}, time),
      ' ',
      d.span({ className: 'name' }, name),
      ' ',
      text)
  },

  Entry() {
    return d.input({
      ref: 'entry',
      onKeyDown: this.key,
      placeholder: 'chat'
    })
  },

  key(e) {
    if (e.key !== 'Enter')
      return

    let el = e.target
    let text = el.value.trim()
    el.value = ''

    if (!text)
      return

    if (text[0] === '/')
      this.command(text.slice(1))
    else
      App.send('say', text)
  },

  command(raw) {
    let [, command, arg] = raw.match(/(\w*)\s*(.*)/)
    arg = arg.trim()
    let text

    switch(command) {
      case 'name':
      case 'nick':
        let name = arg.slice(0, 15)

        if (!name) {
          text = 'enter a name'
          break
        }

        text = `hello, ${name}`
        App.save('name', name)
        App.send('name', name)
        break
      default:
        text = `unsupported command: ${command}`
    }

    this.state.messages.push({ text,
      time: Date.now(),
      name: ''
    })
    this.forceUpdate()
  }
})
