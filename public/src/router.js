import Lobby from './components/lobby'
import Game  from './components/game'
var App

export default function(_App) {
  App = _App
  route()
  window.addEventListener('hashchange', route)
}

function route() {
  var path = location.hash.slice(1)
  var [route, id] = path.split('/')
  var component

  switch(route) {
    case 'g':
      component = Game({ id })
      break
    case '':
      component = Lobby()
      break
    default:
      return App.error(`not found: ${path}`)
  }

  App.component = component
  App.update()
}
