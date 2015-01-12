import App from '../app'
let d = React.DOM

export function LBox(key, text) {
  return d.div({},
    d.label({},
      d.input({
        checkedLink: App.link(key),
        type: 'checkbox'
      }),
      ' ' + text))
}

export function RBox(key, text, props) {
  return d.div(props || {},
    d.label({},
      text + ' ',
      d.input({
        checkedLink: App.link(key),
        type: 'checkbox'
      })))
}
