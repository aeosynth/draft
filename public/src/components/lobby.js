import _ from '../../lib/utils'
import App from '../app'
import data from '../data'
import Chat from './chat'
let d = React.DOM

export default React.createClass({
  componentDidMount() {
    App.send('join', 'lobby')
  },
  render() {
    if (App.state.url)
      var link = d.p({},
        'click ',
        d.a({ href: App.state.url }, 'here'),
        ', wait 5s, then click the button in the top right')

    return d.div({},
      Chat(),
      d.h1({}, 'drafts.in'),
      d.p({ className: 'error' }, App.err),
      link,
      Create(),
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
  let groups = []
  for (let label in data) {
    let sets = data[label]
    let options = []
    for (let name in sets) {
      let code = sets[name]
      options.push(d.option({ value: code }, name))
    }
    groups.push(d.optgroup({ label }, options))
  }
  return d.select({
    valueLink: App.link('sets', index)
  }, groups)
}

function content() {
  let sets = App.state.sets.map(Sets)
  let setsTop = d.div({}, sets.slice(0, 3))
  let setsBot = d.div({}, sets.slice(3))

  let cube = [
    d.div({}, 'one card per line'),
    d.textarea({
      placeholder: 'cube list',
      valueLink: App.link('list')
    })
  ]

  let cards = _.seq(15, 8).map(x => d.option({}, x))
  let packs = _.seq( 7, 3).map(x => d.option({}, x))
  let cubeDraft = d.div({},
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

function Create() {
  let seats = _.seq(8, 2).map(x =>
    d.option({}, x))

  let types = ['draft', 'sealed', 'cube draft', 'cube sealed'].map(type =>
    d.button({
      disabled: type === App.state.type,
      onClick: App._save('type', type)
    }, type))

  return d.div({},
    d.div({},
      d.button({ onClick: App._emit('create') }, 'create'),
      ' room for ',
      d.select({ valueLink: App.link('seats') }, seats)),
    d.div({}, types),
    content())
}
