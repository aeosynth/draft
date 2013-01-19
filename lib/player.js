var EventEmitter = require('events').EventEmitter
  , _ = require('underscore')
  ;

function Player(ws, id, name, index, TIME) {
  this.id = id;
  this.name = name;
  this.packs = [];
  this.picks = [];
  this.time = 0;
  this.TIME = TIME;

  _.bindAll(this);
  this.reset(ws, index);
}

_.extend(Player.prototype, EventEmitter.prototype);

Player.prototype.send = function msg(type, args) {
  if (this.closed) return;
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
  if (this.packs.push(pack) === 1) {
    this.time = this.TIME;
    this.updateSelf();
  }
};

Player.prototype.pickCard = function(packId, cardId) {
  var packs = this.packs
    , pack = packs[0]
    , cards
    , card
    ;

  if (!pack) return; //lol networks
  cards = pack.cards;
  if (!packId) { // auto pick
    packId = pack.id;
    cardId = cards[0].id;
  }
  if (pack.id !== packId) return; // lol networks

  card = _.find(cards, function(card) { return card.id === cardId; });
  this.picks.push(card);
  cards.splice(cards.indexOf(card), 1);
  pack = packs.shift()
  this.time = packs.length ? this.TIME : 0;
  this.updateSelf(card);
  this.emit('pass', pack);
};

Player.prototype.updateSelf = function(card) {
  if (card)
    this.send('pick', card);
  this.send('pack', this.packs[0] || []);
};

Player.prototype.wsClose = function() {
  this.closed = true;
};

Player.prototype.end = function() {
  this.ws.close();
  this.closed = true;
};

Player.prototype.reset = function(ws, index) {
  this.closed = false;
  this.ws = ws;
  this.index = index;
  ws.on('name', this.changeName);
  ws.on('close', this.wsClose);
  ws.on('pick', this.pickCard);
  this.send('picks', this.picks);
  this.send('index', index);
  this.updateSelf();
};

module.exports = Player;
