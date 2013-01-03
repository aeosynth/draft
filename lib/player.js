var EventEmitter = require('events').EventEmitter
  , _ = require('underscore')
  ;

function Player(ws, pid, name) {
  this.ws = ws;
  this.pid = Number(pid);
  this.name = name || 'player';
  this.packs = [];

  _.bindAll(this);
  ws.on('name', this.changeName);
}

_.mixin(Player.prototype, EventEmitter.prototype);

Player.prototype.send = function msg(type, args) {
  var obj = {
    type: type,
    args: args
  };
  this.ws.send(JSON.stringify(obj));
};

Player.prototype.error = function error(msg) {
  this.send('error', [msg]);
};

Player.prototype.changeName = function(name) {
  this.name = name;
  this.emit('change');
};

Player.prototype.receive = function(pack) {
  this.packs.push(pack);
};

Player.prototype.rehydrate = function(ws) {
  this.ws = ws;
};

module.exports = Player;

