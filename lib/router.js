var Player = require('./player');

function message(data) {
  data = JSON.parse(data);
  this.emit.apply(this, data);
}

function q(qid, pid, name) {
  var player = new Player(this, pid, name)
    , q = router.routes[qid]
    ;
  if (q)
    q.add(player);
  else
    player.error('q not found');
}

function router(ws) {
  ws.on('message', message);
  ws.on('q', q);
}

router.routes = [];

module.exports = router;
