var engine = require('engine.io');

function json(name, args) {
  var obj = {
    name: name,
    args: args
  };
  this.send(JSON.stringify(obj));
}

function error(msg) {
  this.json('apperror', msg);
  this.close();
}

function message(message) {
  var error = null
  try {
    message = JSON.parse(message);
  } catch (err) {
    console.log(err, message);
    error = err
  }
  if (!error)
    this.emit.apply(this, message);
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
