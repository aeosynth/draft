var SIZE = 8
  , PACKS = 3
  , TIME = 90
  , EventEmitter = require('events').EventEmitter
  , _ = require('underscore')
  , Player = require('./player')
  , genPack = require('./genPack')
  ;

function Q(set) {
  this.set = set;
  this.id = _.random(1e8);
  this.players = [];
  this.openPacks = 0;
  this.packs = PACKS;
  this.clockwise = false;

  this.decrement = this.decrement.bind(this);
}

_.extend(Q.prototype, EventEmitter.prototype);

Q.prototype.add = function(ws, pid, name) {
  var players = this.players
    , len = players.length
    , self = this
    , player
    ;

  pid = Number(pid);

  if (player = _.find(players, function(player)
    { return player.id === pid; })) {
    player.reset(ws, players.indexOf(player));
    this.meta();
    return;
  }
  if (len === SIZE)
    return ws.error('q full');

  player = new Player(ws, pid, name, len, TIME);
  player.on('pass', function(pack) {
    self.pass(pack, this);
  });

  len = players.push(player);
  if (len === SIZE)
    this.start();
  else
    this.meta();
};

Q.prototype.pass = function(pack, player) {
  var players = this.players
    , len = players.length
    , delta = this.clockwise ? +1 : -1
    , idx = player.index + delta
    ;

  idx = (idx + len) % len; // negative modulo
  if (pack.cards.length)
    players[idx].receive(pack);
  else {
    if (!--this.openPacks)
      this.openPack();
  }
  this.meta();
};

Q.prototype.start = function() {
  this.intervalID = setInterval(this.decrement, 1000);
  this.openPack();
};

Q.prototype.openPack = function() {
  if (!this.packs--)
    return this.end();

  var set = this.set;
  _.each(this.players, function(player) {
    player.receive(genPack(set));
  });
  this.meta();
  this.openPacks = SIZE;
  this.clockwise = !this.clockwise;
};

Q.prototype.decrement = function() {
  _.each(this.players, function(player) {
    if (player.packs.length && !--player.time)
      player.pickCard();
  });
};

Q.prototype.end = function() {
  clearInterval(this.intervalID);
  this.meta();
  _.invoke(this.players, 'end');
  this.emit('end'); // remove this q from router
};

Q.prototype.meta = function() {
  var players = this.players
    , meta = []
    ;
  _.each(players, function(player) {
    meta.push({
      name: player.name,
      packs: player.packs.length,
      time: player.time
    });
  });
  _.each(players, function(player) {
    player.send('players', meta);
  });
};

module.exports = Q;
