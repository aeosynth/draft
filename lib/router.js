var Player = require('./player')
  , Q = require('./q')
  , routes = {}
  , DELETE_DELAY = 1000 * 60 * 60
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
  var id = this.id;
  setTimeout(function() {
    delete routes[id];
  }, DELETE_DELAY);
}

router.create = function(sets) {
  var q = new Q(sets)
    , id = q.id
    ;
  q.on('end', end);
  routes[id] = q;
  return id;
};

module.exports = router;
