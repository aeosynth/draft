var EventEmitter, rand, Player;
EventEmitter = require('events').EventEmitter;
rand = require('./_').rand;
Player = (function(superclass){
  Player.displayName = 'Player';
  var prototype = extend$(Player, superclass).prototype, constructor = Player;
  function Player(){
    importAll$(this, {
      picks: [],
      packs: [],
      main: []
    });
  }
  prototype.time = 0;
  prototype.startRound = function(){
    return this.picks.push(this.round = []);
  };
  prototype.receive = function(pack){
    this.packs.push(pack);
    if (this.packs.length === 1) {
      return this.sendPack();
    }
  };
  prototype.autopick = function(){
    var index;
    index = rand(this.packs[0].length);
    return this.pick(index, true);
  };
  prototype.pick = function(index, autopick){
    var pack, pick;
    pack = this.packs.shift();
    pick = pack.splice(index, 1)[0];
    this.main.push(pick);
    this.round.push({
      name: pick.name,
      autopick: autopick
    });
    if (this.packs.length) {
      this.sendPack();
    }
    return this.emit('pass', pack, this.index);
  };
  return Player;
}(EventEmitter));
module.exports = Player;
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