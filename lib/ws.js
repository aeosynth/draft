var WSS = require('ws').Server;

function json(name, args) {
  var obj = {
    name: name,
    args: args
  };
  this.send(JSON.stringify(obj));
}

function error(msg) {
  this.json('error', msg);
  this.close();
}

function message(message) {
  message = JSON.parse(message);
  this.emit.apply(this, message);
}

function decorate(ws) {
  ws.json = json;
  ws.error = error;
  ws.on('message', message);
}

function wss(server) {
  var wss = new WSS({ server: server });
  wss.on('connection', decorate);
  return wss;
}

module.exports = wss;
