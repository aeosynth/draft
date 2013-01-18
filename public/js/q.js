angular.module('app', [], function($provide) {
  $provide.factory('ws', function() {
    var ws = new WebSocket('ws://' + location.host);
    ws.cb = {};
    ws.onopen = function() {
      ws._emit('connect');
    };
    ws.onmessage = function(msg) {
      console.log(msg);
      msg = JSON.parse(msg);
      ws._emit(msg.event, msg.arg);
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
    ws.emit = function(event, obj) {
      obj.event = event;
      ws.send(JSON.stringify(obj));
    };
    return ws;
  });
});

function Ctrl($scope, ws) {
  localStorage.pid || (localStorage.pid = Math.floor(Math.random() * 1e8));

  ws.on('connect', function() {
    ws.emit('init', {
      qid: location.hash.slice(1)
    , pid: localStorage.pid
    , name: localStorage.name
    });
  });

  ws.on('index', function(index) {
    $scope.index = index;
  });
  ws.on('meta', function(players) {
    $scope.players = players;
  });
  ws.on('pick', function(card) {
    $scope.main.push(card);
  });
  ws.on('picks', function(cards) {
    $scope.main = cards;
  });
  ws.on('end', function() {
    $scope.end = true;
  });

  $scope.pick = function(card) {
    ws.emit('pick', card);
  };
  $scope.name = function(name) {
    ws.emit('name', name);
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
    var main = []
      , side = []
      ;
    angular.forEach($scope.main, function(card) {
      main.push(card.name);
    });
    angular.forEach($scope.side, function(card) {
      side.push(card.name);
    });
    console.log(main);
    console.log(side);
  };
}
