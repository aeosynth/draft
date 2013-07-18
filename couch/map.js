function(doc) {
  var players = doc.players;
  for (var i = 0, l = players.length; i < l; i++) {
    var player = players[i];
    if (player.isBot) continue;
    var picks = player.picks;
    for (var j = 0; j < 3; j++) {
      var cards = picks[j];
      for (var k = 0, ll = cards.length; k < ll; k++) {
        var card = cards[k];
        if (card.autopick) continue;
        emit(card.name, k);
      } 
    } 
  } 
}
