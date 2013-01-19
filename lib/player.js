var EventEmitter = require('events').EventEmitter
  , _ = require('underscore')
  ;

function Player(ws, id, name, index) {
  this.id = id;
  this.name = name || 'player';
  this.packs = [];
  this.picks = [];

  _.bindAll(this);
  this.reset(ws, index);
}

_.extend(Player.prototype, EventEmitter.prototype);

Player.prototype.send = function msg(type, args) {
  if (!this.ws) return;
  var obj = {
    name: type,
    args: args
  };
  this.ws.send(JSON.stringify(obj));
};

Player.prototype.changeName = function(name) {
  this.name = name;
  this.emit('meta');
};

Player.prototype.receive = function(pack) {
  if (this.packs.push(pack) === 1)
    this.updateSelf();
};

Player.prototype.pickCard = function(packId, cardId) {
  var pack = this.packs[0]
    , cards = pack.cards
    , card
    ;
  if (!packId) { // auto pick
    packId = pack.id;
    cardId = cards[0].id;
  }
  if (pack.id !== packId) return; // lol networks

  card = _.find(cards, function(card) { return card.id === cardId; });
  this.picks.push(card);
  cards.splice(cards.indexOf(card), 1);
  this.emit('pass', packs.shift());

  this.time = this.packs.length ? this.TIME : 0;
  this.updateSelf();
};

Player.prototype.updateSelf = function(card) {
  var pack = this.packs[0];
  this.send('self', { pack: pack, card: card });
};

Player.prototype.wsClose = function() {
  this.ws = null;
};

Player.prototype.reset = function(ws, index) {
  this.ws = ws;
  ws.on('name', this.changeName);
  ws.on('close', this.wsClose);
  this.send('picks', this.picks);
  this.send('index', [index]);
  this.updateSelf();
};

module.exports = Player;
