var SIZE = 8
  , _ = require('underscore')
  , genPack = require('./genPack')
  ;

function Q(set) {
  this.set = set;
  this.id = _.random(1e8);
  this.players = [];
}

Q.prototype.add = function(player) {
  var players = this.players
    , len = players.length
    , _player
    ;

  if (_player = _.find(players, function(player) { return player.pid === pid; }))
    return _player.rehydrate(player.ws);
  if (len === SIZE)
    return player.error('q full');

  player.send('idx', [len]);
  len = players.push(player);

  if (len === SIZE)
    this.start();
  else
    this.meta();
};

Q.prototype.start = function() {
  var set = this.set;
  _.each(this.players, function(player) {
    player.receive(genPack(set));
  });
  this.meta();
};

Q.prototype.meta = function() {
  console.log('meta');
};

module.exports = Q;
