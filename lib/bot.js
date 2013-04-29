var Player, nop, Bot;
Player = require('./player');
nop = function(){};
Bot = (function(superclass){
  Bot.displayName = 'Bot';
  var prototype = extend$(Bot, superclass).prototype, constructor = Bot;
  function Bot(){
    superclass.call(this);
  }
  prototype.isBot = true;
  prototype.name = 'bot';
  prototype.send = nop;
  prototype.sendPack = function(){
    var pack;
    pack = this.packs[0];
    if (pack.length === 1) {
      return this.pick(0, true);
    } else {
      return process.nextTick(bind$(this, 'autopick'));
    }
  };
  return Bot;
}(Player));
module.exports = Bot;
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}
function bind$(obj, key){
  return function(){ return obj[key].apply(obj, arguments) };
}