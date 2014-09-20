import _ from '../../lib/utils'
import App from '../app'
import data from '../data'
import Chat from './chat'
var d = React.DOM

export default React.createClass({
  componentDidMount() {
    App.send('join', 'lobby')
  },
  render() {
    return d.div({},
      Chat(),
      d.h1({}, 'drafts.in'),
      d.p({ className: 'error' }, App.err),
      Create(),
      Tabs(),
      d.footer({},
        d.div({},
          d.a({ className: 'icon ion-social-github', href: 'https://github.com/aeosynth/draft' }),
          d.a({ className: 'icon ion-social-twitter', href: 'https://twitter.com/aeosynth' }),
          d.a({ className: 'icon ion-android-mail', href: 'mailto:james.r.campos@gmail.com' })),
        d.div({},
          d.small({}, 'unaffiliated with wizards of the coast'))))
  }
})

function Sets(selectedSet, index) {
  var groups = []
  for (var label in data) {
    var sets = data[label]
    var options = []
    for (var name in sets) {
      var code = sets[name]
      options.push(d.option({ value: code }, name))
    }
    groups.push(d.optgroup({ label }, options))
  }
  return d.select({
    valueLink: App.link('sets', index)
  }, groups)
}

function content() {
  var sets = App.state.sets.map(Sets)
  var setsTop = d.div({}, sets.slice(0, 3))
  var setsBot = d.div({}, sets.slice(3))

  var cube = [
    d.div({}, 'one card per line'),
    d.textarea({
      placeholder: 'cube list',
      valueLink: App.link('list')
    })
  ]

  var cards = _.seq(15, 8).map(x => d.option({}, x))
  var packs = _.seq( 5, 3).map(x => d.option({}, x))
  var cubeDraft = d.div({},
    d.select({ valueLink: App.link('cards') }, cards),
    ' cards ',
    d.select({ valueLink: App.link('packs') }, packs),
    ' packs')

  switch(App.state.type) {
    case 'draft' : return setsTop
    case 'sealed': return [setsTop, setsBot]
    case 'cube draft' : return [cube, cubeDraft]
    case 'cube sealed': return cube
  }
}

function Tabs() {
  var types = ['draft', 'sealed', 'cube draft', 'cube sealed'].map(type =>
    d.button({
      disabled: type === App.state.type,
      onClick: App._save('type', type)
    }, type))
  return [
    d.div({}, types),
    d.div({}, content())
  ]
}

function Create() {
  var seats = _.seq(8, 2).map(x =>
    d.option({}, x))

  return d.div({},
    d.button({ onClick: App._emit('create') }, 'create'),
    ' room for ',
    d.select({ valueLink: App.link('seats') }, seats))
}
