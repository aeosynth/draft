var Player = require('./player')
  , Q = require('./q')
  , routes = {}
  ;

function message(message) {
  message = JSON.parse(message);
  this.emit.apply(this, message);
}

function error(obj) {
  this.send(JSON.stringify(obj));
  this.close();
}

function router(ws) {
  ws.on('message', message);
  ws.on('route', route);
  ws.error = error;
}

function route(qid, pid, name) {
  var q = router.routes[qid];
  if (q)
    q.add(this, pid, name);
  else
    this.error('q not found');
}

function end() {
  delete router.routes[this.id];
}

router.create = function(set) {
  var q = new Q(set)
    , id = q.id
    ;
  q.on('end', end);
  routes[id] = q;
  return id;
};

module.exports = router;
