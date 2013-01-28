var SIZE = 8
  , TIME = 90
  , EventEmitter = require('events').EventEmitter
  , _ = require('underscore')
  , Player = require('./player')
  , genPack = require('./genPack')
  , DELETE_DELAY = 1000 * 60 * 60
  ;

function Q(sets) {
  this.sets = sets;
  this.id = _.random(1e8);
  this.players = [];
  this.openPacks = 0;
  this.clockwise = false;
  this.started = false;
  this.ended = false;

  _.bindAll(this, 'decrement', 'meta', 'playerClose', 'end2');
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
    if (this.ended)
      player.end();
    return;
  }
  if (len === SIZE)
    return ws.error('q full');

  player = new Player(ws, pid, name, len, TIME);
  player.on('close', this.playerClose);
  player.on('meta', this.meta);
  player.on('pass', function(pack) {
    self.pass(pack, this);
  });

  len = players.push(player);
  if (len === SIZE)
    this.start();
  else
    this.meta();
};

Q.prototype.playerClose = function(player) {
  var players = this.players;
  if (!this.started) {
    players.splice(players.indexOf(player), 1);
    _.each(players, function(player, index) {
      player.index = index;
    });
  }
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
  this.started = true;
  this.intervalID = setInterval(this.decrement, 1000);
  this.openPack();
};

Q.prototype.openPack = function() {
  var set = this.sets.shift();
  if (!set)
    return this.end();

  this.openPacks = SIZE;
  this.clockwise = !this.clockwise;
  _.each(this.players, function(player) {
    player.receive(genPack(set));
  });
  this.meta();
};

Q.prototype.decrement = function() {
  _.each(this.players, function(player) {
    if (player.packs.length && !--player.time)
      player.autoPick();
  });
};

Q.prototype.end = function() {
  clearInterval(this.intervalID);
  this.ended = true;
  this.meta();
  setTimeout(this.end2, DELETE_DELAY);
};

Q.prototype.end2 = function() {
  _.invoke(this.players, 'end');
  this.emit('end'); // remove this q from router
};

Q.prototype.meta = function() {
  var players = this.players
    , arr = []
    ;
  _.each(players, function(player) {
    arr.push({
      disconnected: player.closed,
      dropped: player.dropped,
      hash: player.hash,
      name: player.name,
      packs: player.packs.length,
      time: player.time
    });
  });
  _.each(players, function(player, index) {
    var meta = {
      players: arr,
      index: index
    };
    player.send('meta', meta);
  });
};

module.exports = Q;
