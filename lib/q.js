var TIME = 90
  , EventEmitter = require('events').EventEmitter
  , _ = require('underscore')
  , Player = require('./player')
  , genPack = require('./genPack')
  , DELETE_DELAY = 1000 * 60 * 60
  ;

try {
  var cube = require('../cards/cube');
} catch (err) {
  console.log('no cubes found');
}

function Q(sets, type, size, bots, cubeName) {
  if (type !== 'sealed') sets = sets.slice(0, 3);
  if (type === 'cube') {
    var shuffled = _.shuffle(cube[cubeName]);
    sets = [shuffled, shuffled, shuffled];
  }
  size = Number(size);
  bots = Math.min(Number(bots), size - 1);
  this.size = size;
  this.sets = sets;
  this.type = type;
  this.id = _.random(1e8);
  this.players = [];
  this.openPacks = 0;
  this.clockwise = false;
  this.started = false;
  this.ended = false;

  _.bindAll(this, 'decrement', 'meta', 'playerClose', 'end2');

  function nop() {}
  while (bots--) {// FIXME this is horribly hacky
    this.add({ send: nop, on: nop, json: nop }, _.random(1e8), 'bot', true);
  }
}

_.extend(Q.prototype, EventEmitter.prototype);

Q.prototype.add = function(ws, pid, name, isBot) {
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
  if (len === this.size)
    return ws.error('q full');

  player = new Player(ws, pid, name, len, TIME, isBot);
  player.on('close', this.playerClose);
  player.on('meta', this.meta);
  player.on('pass', function(pack) {
    self.pass(pack, this);
  });

  len = players.push(player);
  if (len === this.size)
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
  if (this.type === 'sealed') {
    var sets = this.sets;
    this.ended = true;
    _.each(this.players, function(player) {
      var picks = _.chain(sets)
        .map(genPack)
        .pluck('cards')
        .flatten()
        .value()
      ;
      player.picks = picks;
      player.send('picks', picks);
    });
    this.meta();
  } else {
    this.intervalID = setInterval(this.decrement, 1000);
    this.openPack();
  }
};

Q.prototype.openPack = function() {
  var set = this.sets.shift();
  if (!set)
    return this.end();

  this.openPacks = this.size;
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
    , ended = this.ended
    , size = this.size
    ;
  _.each(players, function(player) {
    arr.push({
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
      ended: ended,
      index: index,
      size: size
    };
    player.send('meta', meta);
  });
};

module.exports = Q;
