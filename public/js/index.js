angular.module('app', [], function($provide, $routeProvider, $locationProvider) {
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
  $provide.factory('ws', function() {
    var ws = new WebSocket('ws://' + location.host);
    ws.cb = {};
    ws.onopen = function() {
      ws._emit('connect');
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
  });
});

function CreateCtrl($scope, $http, $location) {
  $scope.pack1 = 'Return to Ravnica';
  $scope.pack2 = 'Return to Ravnica';
  $scope.pack3 = 'Return to Ravnica';
  $scope.create = function() {
    var sets = [$scope.pack1, $scope.pack2, $scope.pack3];
    $http.post('/create', { sets: sets })
      .success(function(data, status) {
        $location.path('/q/' + data.id);
      })
      ;
  };
}

function QCtrl($scope, $timeout, $http, $routeParams, ws) {
  $scope.main = [];
  $scope.side = [];

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

  ws.on('index', function(index) {
    $scope.index = index;
    $scope.opponentIndex = (index + 4) % 8;// XXX magic
    $scope.$apply();
  });
  ws.on('players', function(players) {
    $scope.players = players;
    $scope.self = $scope.players[$scope.index];
    $scope.self.class = 'self';
    var opp = $scope.players[$scope.opponentIndex];
    if (opp)
      opp.class = 'opponent';
    if (!$scope.self.name)
      $scope.self.edit = true;
    $scope.$apply();
  });
  ws.on('pack', function(pack) {
    if (pack) {
      pack.show = true;
      if (pack.cards.length && $scope.beep)
        document.querySelector('audio').play();
    }
    $scope.pack = pack;
    $scope.$apply();
  });
  ws.on('pick', function(card) {
    $scope.main.push(card);
    $scope.$apply();
  });
  ws.on('picks', function(cards) {
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
    $scope.side.push(card);
  };
  $scope.toMain = function(card) {
    var side = $scope.side;
    side.splice(side.indexOf(card), 1);
    $scope.main.push(card);
  };
  $scope.download = function() {
    var main = {}
      , side = {}
      , deck = []
      ;
    angular.forEach($scope.main, function(card) {
      main[card.name] || (main[card.name] = 0);
      main[card.name] += 1;
    });
    angular.forEach($scope.side, function(card) {
      side[card.name] || (side[card.name] = 0);
      side[card.name] += 1;
    });
    angular.forEach(main, function(num, name) {
      deck.push(num + ' ' + name);
    });
    angular.forEach(side, function(num, name) {
      deck.push('SB: ' + num + ' ' + name);
    });
    $scope.deck = deck.join('\n');
  };
}
