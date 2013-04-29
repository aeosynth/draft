var EventEmitter, Bot, Human, db, ref$, next, rand, shuffle, Draft;
EventEmitter = require('events').EventEmitter;
Bot = require('./bot');
Human = require('./human');
db = require('./db');
ref$ = require('./_'), next = ref$.next, rand = ref$.rand, shuffle = ref$.shuffle;
Draft = (function(superclass){
  Draft.displayName = 'Draft';
  var prototype = extend$(Draft, superclass).prototype, constructor = Draft;
  function Draft(opts){
    importAll$(this, opts);
    importAll$(this, {
      delta: -1,
      id: rand(1e9).toString(16),
      players: [],
      round: 0,
      startTime: Date.now() / 1e3 | 0
    });
  }
  prototype.join = function(sock){
    var name, i$, ref$, len$, p, h;
    name = sock.name;
    for (i$ = 0, len$ = (ref$ = this.players).length; i$ < len$; ++i$) {
      p = ref$[i$];
      if (p.name === name) {
        return p.attach(sock);
      }
    }
    if (this.players.length === this.seats) {
      return p.send('error', 'draft full');
    }
    h = new Human(sock);
    h.isHost = sock.id === this.host;
    return this.add(h);
  };
  prototype.add = function(p){
    this.players.push(p);
    p.on('pass', bind$(this, 'pass'));
    if (p.isBot) {
      return;
    }
    this.meta();
    if (p.isHost) {
      p.once('start', bind$(this, 'start'));
      return p.emit('start');
    }
  };
  prototype.meta = function(){
    var players, res$, i$, ref$, len$, p, j$, ref1$, len1$, results$ = [];
    res$ = [];
    for (i$ = 0, len$ = (ref$ = this.players).length; i$ < len$; ++i$) {
      p = ref$[i$];
      res$.push({
        name: p.name,
        time: p.time,
        packs: p.packs.length
      });
    }
    players = res$;
    for (j$ = 0, len1$ = (ref1$ = this.players).length; j$ < len1$; ++j$) {
      p = ref1$[j$];
      results$.push(p.send('set', {
        players: players
      }));
    }
    return results$;
  };
  prototype.start = function(){
    var i, ref$, len$, p;
    if (this.addBots) {
      while (this.players.length < this.seats) {
        this.add(new Bot);
      }
    }
    shuffle(this.players);
    for (i = 0, len$ = (ref$ = this.players).length; i < len$; ++i) {
      p = ref$[i];
      p.index = i;
    }
    return this.startRound();
  };
  prototype.startRound = function(){
    var set, i$, ref$, len$, p, results$ = [];
    if (!(set = this.sets[this.round++])) {
      return this.end();
    }
    this.delta *= -1;
    this.activePacks = this.players.length;
    for (i$ = 0, len$ = (ref$ = this.players).length; i$ < len$; ++i$) {
      p = ref$[i$];
      results$.push(p.start(set));
    }
    return results$;
  };
  prototype.pass = function(pack, index){
    var player;
    player = next(this.players, this.delta, index);
    if (pack.length) {
      player.receive(pack);
    } else if (!--this.activePacks) {
      this.startRound();
    }
    return this.meta();
  };
  prototype.end = function(){
    var data, res$, i$, ref$, len$, p;
    console.log('end', this.id);
    data = {
      sets: this.sets,
      start: this.startTime
    };
    data.end = Date.now() / 1e3 | 0;
    res$ = [];
    for (i$ = 0, len$ = (ref$ = this.players).length; i$ < len$; ++i$) {
      p = ref$[i$];
      res$.push({
        isBot: p.isBot,
        picks: p.picks
      });
    }
    data.players = res$;
    return db(data);
  };
  return Draft;
}(EventEmitter));
module.exports = Draft;
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}
function importAll$(obj, src){
  for (var key in src) obj[key] = src[key];
  return obj;
}
function bind$(obj, key){
  return function(){ return obj[key].apply(obj, arguments) };
}