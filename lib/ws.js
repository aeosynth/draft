var engine = require('engine.io');

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
  try {
    message = JSON.parse(message);
    this.emit.apply(this, message);
  } catch (err) {
    console.log(err);
  }
}

function logError(err) {
  console.log(err);
}

function decorate(ws) {
  ws.json = json;
  ws.error = error;
  ws.on('message', message);
  ws.on('error', logError);
}

function wss(server) {
  var wss = engine.attach(server);
  wss.on('connection', decorate);
  return wss;
}

module.exports = wss;
