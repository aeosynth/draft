var Player = require('./player')
  , Q = require('./q')
  , routes = {}
  ;

function router(ws) {
  ws.on('init', route);
}

function route(qid, pid, name) {
  var q = routes[qid];
  if (q)
    q.add(this, pid, name);
  else
    this.error('q not found');
}

function end() {
  delete routes[this.id];
}

router.create = function(sets, sealed, size) {
  var q = new Q(sets, sealed, size)
    , id = q.id
    ;
  q.on('end', end);
  routes[id] = q;
  return id;
};

module.exports = router;
