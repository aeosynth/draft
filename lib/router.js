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
    var draft;
    draft = new Draft(opts);
    drafts[draft.id] = draft;
    draft.on('end', rm);
    return draft.id;
  },
  connect: function(ws){
    var sock, room, draft;
    sock = new Sock(ws);
    room = sock.room;
    if (draft = drafts[room]) {
      return draft.join(sock);
    } else {
      return sock.send('error', 'room not found');
    }
  }
};
module.exports = router;