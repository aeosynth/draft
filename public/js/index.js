angular
.module('app', [], function($routeProvider, $locationProvider) {
  $locationProvider.html5Mode(true);

  $routeProvider
    .when('/', {
      templateUrl: '/partials/create.html',
      controller: CreateCtrl
    })
    .when('/q/:qid', {
      templateUrl: '/partials/q.html',
      controller: QCtrl
    })
    ;
})
.factory('ws', function() {
  var ws = new WebSocket('ws://' + location.host);
  ws.cb = {};
  ws.onopen = function() {
    ws._emit('connect');
  };
  ws.onerror = function(error) {
    ws._emit('error', error);
  };
  ws.onclose = function() {
    ws._emit('disconnect');
  };
  ws.onmessage = function(msg) {
    var data = JSON.parse(msg.data);
    ws._emit(data.name, data.args);
  };
  ws.on = function(event, cb) {
    ws.cb[event] || (ws.cb[event] = []);
    ws.cb[event].push(cb);
  };
  ws._emit = function(event, arg) {
    angular.forEach(ws.cb[event], function(cb) {
      cb(arg);
    });
  };
  ws.emit = function() {
    var args = Array.prototype.slice.call(arguments);
    ws.send(JSON.stringify(args));
  };
  return ws;
})
.directive('card', function() {
  return {
    restrict: 'E',
    template: '<img ng-src="http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid={{ card.id }}&type=card">'
  };
})
;

function CreateCtrl($scope, $http, $location) {
  $scope.size = 8;
  $scope.sets = [
    'Gatecrash',
    'Return to Ravnica',
    'Magic 2013',
    'Avacyn Restored',
    'Dark Ascension',
    'Innistrad',
    'Magic 2012',
    'New Phyrexia',
    'Mirrodin Besieged',
    'Scars of Mirrodin',
    'Magic 2011',
    'Rise of the Eldrazi',
    'Worldwake',
    'Zendikar',
    'Alara Reborn',
    'Conflux',
    'Shards of Alara'
  ];
  $scope.set1 = 'Gatecrash';
  $scope.set2 = 'Gatecrash';
  $scope.set3 = 'Gatecrash';
  $scope.set4 = 'Gatecrash';
  $scope.set5 = 'Gatecrash';
  $scope.set6 = 'Gatecrash';
  $scope.create = function() {
    var sets = [$scope.set1, $scope.set2, $scope.set3, $scope.set4, $scope.set5, $scope.set6];
    $http.post('/create', { sets: sets, sealed: $scope.sealed, size: $scope.size })
      .success(function(data, status) {
        $location.path('/q/' + data.id);
      })
      ;
  };
}

function QCtrl($scope, $timeout, $http, $routeParams, ws) {
  $scope.order = 'name';
  $scope.main = [];
  $scope.side = [];
  $scope.land = [
  { land: true, cmc: 0, id: 73946, name: 'Forest'   },
  { land: true, cmc: 0, id: 73951, name: 'Island'   },
  { land: true, cmc: 0, id: 73958, name: 'Mountain' },
  { land: true, cmc: 0, id: 73963, name: 'Plains'   },
  { land: true, cmc: 0, id: 73973, name: 'Swamp'    }
  ];

  localStorage.pid || (localStorage.pid = Math.floor(Math.random() * 1e8));

  function decrement() {
    angular.forEach($scope.players, function(player) {
      if (player.time)
        --player.time;
    });
    $timeout(decrement, 1000);
  }

  $timeout(decrement, 1000);

  ws.on('connect', function() {
    var qid = $routeParams.qid
    , pid = localStorage.pid
    , name = localStorage.name
    ;
    ws.emit('init', qid, pid, name);
  });
  ws.on('error', function(error) {
    $scope.error = error;
    $scope.$apply();
  });

  ws.on('meta', function(meta) {
    var players = meta.players
      , index = meta.index
      , ended = meta.ended
      , size = meta.size
      , oppIndex
      ;
    if (size === 8)// XXX magic
      oppIndex = (index + (size/2)) % size;
    while(size > players.length)
      players.push({});
    $scope.end = ended;
    $scope.players = players;
    $scope.self = $scope.players[index];
    $scope.self.self = true;
    var opp = players[oppIndex];
    if (opp)
      opp.opponent = true;
    if (!$scope.self.name)
      $scope.self.edit = true;
    $scope.$apply();
  });
  ws.on('pack', function(pack) {
    if (pack) {
      pack.show = true;
      if (pack.cards.length && $scope.beep)
        document.querySelector('audio').play();
      angular.forEach(pack.cards, function(card) {
        if (!card.imgURL)
          card.imgURL = "http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=" + card.id + "&type=card";
      });
    }
    $scope.pack = pack;
    $scope.$apply();
  });
  ws.on('pick', function(card) {
    if (!card.imgURL)
      card.imgURL = "http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=" + card.id + "&type=card";
    $scope.main.push(card);
    $scope.$apply();
  });
  ws.on('picks', function(cards) {
    angular.forEach(cards, function(card) {
      if (!card.imgURL)
        card.imgURL = "http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=" + card.id + "&type=card";
    });
    $scope.main = cards;
    $scope.$apply();
  });
  ws.on('disconnect', function() {
    $scope.end = true;
    $scope.$apply();
  });

  $scope.pick = function(card) {
    ws.emit('pick', $scope.pack.id, card.id);
    $scope.pack.show = false;
  };
  $scope.name = function(name) {
    $scope.self.edit = false;
    ws.emit('name', name);
    localStorage.name = name;
  };
  $scope.toSide = function(card) {
    var main = $scope.main;
    main.splice(main.indexOf(card), 1);
    if (!card.land)
      $scope.side.push(card);
  };
  $scope.toMain = function(card) {
    var side = $scope.side;
    side.splice(side.indexOf(card), 1);
    if (!card.land)
      $scope.main.push(card);
  };
  $scope.addLand = function(card, e) {
    if (e.shiftKey)
      $scope.side.push(card);
    else
      $scope.main.push(card);
  };
  $scope.generateDeck = function() {
    var main = {}
      , side = {}
      ;
    angular.forEach($scope.main, function(card) {
      var name = card.name;
      main[name] || (main[name] = 0);
      main[name] += 1;
    });
    angular.forEach($scope.side, function(card) {
      var name = card.name;
      side[name] || (side[name] = 0);
      side[name] += 1;
    });
    $scope.deck = {
      main: main,
      side: side
    };
    $scope.deckJSON = JSON.stringify($scope.deck);
  };
  $scope.hash = function() {
    $scope.generateDeck();
    ws.emit('hash', $scope.deck);
  };
}
