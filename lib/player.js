var EventEmitter = require('events').EventEmitter
  , _ = require('underscore')
  , genHash = require('./genHash')
  ;

function Player(ws, id, name, index, TIME, isBot) {
  this.isBot = isBot;
  this.id = id;
  this.name = name;
  this.packs = [];
  this.picks = [];
  this.time = 0;
  this.TIME = isBot ? 1 : TIME;
  this.hasAutoPicked = false;
  this.dropped = false;

  _.bindAll(this);
  this.reset(ws, index);
}

_.extend(Player.prototype, EventEmitter.prototype);

Player.prototype.generateHash = function(deck) {
  if (this.hash) return;
  this.hash = genHash(deck);
  this.emit('meta');
};

Player.prototype.send = function (name, args) {
  if (this.closed) return;
  this.ws.json(name, args);
};

Player.prototype.changeName = function(name) {
  if (!name) return;
  this.name = name.slice(0, 15);
  this.emit('meta');
};

Player.prototype.receive = function(pack) {
  if (this.packs.push(pack) === 1) {
    this.time = this.TIME;
    this.updateSelf();
  }
};

Player.prototype.pick = function(packId, cardId) {
  this.hasAutoPicked = false;
  this.pickCard(packId, cardId);
};

Player.prototype.autoPick = function() {
  if (this.hasAutoPicked && !this.isBot) {
    this.dropped = true;
    this.TIME = 1;
  }
  else
    this.hasAutoPicked = true;

  var packs = this.packs
    , pack = packs[0]
    , packId = pack.id
    , cardId = _.shuffle(pack.cards)[0].id
    ;
  this.pickCard(packId, cardId);

  if (this.dropped && this.packs.length)
    this.autoPick();
};

Player.prototype.pickCard = function(packId, cardId) {
  var packs = this.packs
    , pack = packs[0]
    , cards
    , card
    ;

  if ((!pack) || (pack.id !== packId))
    return; // lol networks

  cards = pack.cards;
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
  this.send('pack', this.packs[0]);
};

Player.prototype.wsClose = function() {
  this.closed = true;
  this.emit('close', this);
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
  ws.on('pick', this.pick);
  ws.on('hash', this.generateHash);
  this.send('picks', this.picks);
  this.updateSelf();
};

module.exports = Player;
