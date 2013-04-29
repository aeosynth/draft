var Draft, Sock, drafts, rm, router;
Draft = require('./draft');
Sock = require('./sock');
drafts = {};
rm = function(){
  var key$, ref$;
  return ref$ = drafts[key$ = this.id], delete drafts[key$], ref$;
};
router = {
  create: function(opts){
    var x0$, draft;
    x0$ = draft = new Draft(opts);
    x0$.on('end', rm);
    drafts[x0$.id] = x0$;
    return draft.id;
  },
  connect: function(ws){
    var sock, room, that;
    sock = new Sock(ws);
    room = sock.room;
    if (that = drafts[room]) {
      return that.join(sock);
    } else {
      return sock.send('error', 'room not found');
    }
  }
};
module.exports = router;