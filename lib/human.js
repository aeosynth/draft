var Player, Human;
Player = require('./player');
Human = (function(superclass){
  Human.displayName = 'Human';
  var prototype = extend$(Human, superclass).prototype, constructor = Human;
  function Human(sock, isHost){
    this.sock = sock;
    this.isHost = isHost;
    superclass.call(this);
    importAll$(this, {
      name: sock.name,
      id: sock.id
    });
    this.attach(sock);
  }
  prototype.attach = function(sock){
    var this$ = this;
    this.sock.removeAllListeners();
    this.sock = sock;
    this.send = bind$(sock, 'send');
    this.send('set', {
      isHost: this.isHost,
      main: this.main,
      pack: this.packs[0]
    });
    sock.on('pick', bind$(this, 'pick'));
    sock.on('name', function(name){
      this$.name = name;
      return this$.emit('name');
    });
    sock.on('drop', function(){
      return this$.emit('drop', this$);
    });
    if (this.isHost) {
      return sock.on('start', function(it){
        return this$.emit('start', it);
      });
    }
  };
  prototype.start = function(set, round){
    superclass.prototype.start.call(this, set);
    return this.send('set', {
      round: round
    });
  };
  prototype.sendPack = function(){
    var pack;
    pack = this.packs[0];
    if (pack.length === 1) {
      return this.pick(0, true);
    } else {
      return this.send('set', {
        pack: pack
      });
    }
  };
  prototype.pick = function(index){
    var ref$;
    superclass.prototype.pick.call(this, index);
    return this.send('add', (ref$ = this.main)[ref$.length - 1]);
  };
  return Human;
}(Player));
module.exports = Human;
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