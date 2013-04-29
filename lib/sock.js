var EventEmitter, Sock;
EventEmitter = require('events').EventEmitter;
Sock = (function(superclass){
  Sock.displayName = 'Sock';
  var prototype = extend$(Sock, superclass).prototype, constructor = Sock;
  function Sock(ws){
    var ref$;
    this.ws = ws;
    importAll$(this, {
      id: (ref$ = ws.request.query).id,
      name: ref$.name,
      room: ref$.room
    });
    ws.on('message', bind$(this, 'message'));
  }
  prototype.message = function(it){
    return this.emit.apply(this, JSON.parse(it));
  };
  prototype.send = function(name, args){
    return this.ws.send(JSON.stringify({
      name: name,
      args: args
    }));
  };
  return Sock;
}(EventEmitter));
module.exports = Sock;
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