log = console.log.bind console

App =
  init: ->
    @ws = ws = new WebSocket "ws://#{location.host}"

    ws.onopen    = @cb.open
    ws.onmessage = @cb.message
    ws.onclose   = @cb.close

  msg: (args...) ->
    @ws.send JSON.stringify args

  cb:
    open: ->
      qid = location.hash[1..]
      {pid, name} = localStorage
      unless pid
        pid = localStorage.pid = Math.floor Math.random() * 1e8
      App.msg 'q', qid, pid, name
    message: (e) ->
      {type, args} = JSON.parse e.data
      App.cb[type].apply App, args
    close: ->
      log 'close'

    idx: (idx) ->
      log idx

App.init()
