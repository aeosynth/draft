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
  var ws = eio('ws://' + location.host);
  ws.on('message', function(msg) {
    var data = JSON.parse(msg);
    ws.emit(data.name, data.args);
  });
  ws.json = function() {
    var args = Array.prototype.slice.call(arguments);
    ws.send(JSON.stringify(args));
  };
  return ws;
})
;

function CreateCtrl($scope, $http, $location) {
  $scope.bots = 0;
  $scope.cube = 'mtgo holiday';
  $scope.type = 'draft';
  $scope.size = 8;

  $scope.sets = [
    "Dragon's Maze",
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
    'Magic 2010',
    'Alara Reborn',
    'Conflux',
    'Shards of Alara',
    'Eventide',
    'Shadowmoor',
    'Morningtide',
    'Lorwyn',
    'Tenth Edition',
    'Future Sight',
    'Planar Chaos',
    'Time Spiral',
    'Dissension',
    'Guildpact',
    'Ravnica: City of Guilds',
    'Ninth Edition',
    'Saviors of Kamigawa',
    'Betrayers of Kamigawa',
    'Champions of Kamigawa',
    'Fifth Dawn',
    'Darksteel',
    'Mirrodin',
    'Eighth Edition',
    'Scourge',
    'Legions',
    'Onslaught',
    'Judgment',
    'Torment',
    'Odyssey',
    'Seventh Edition',
    'Apocalypse',
    'Planeshift',
    'Invasion',
    'Classic Sixth Edition',
    'Prophecy',
    'Nemesis',
    'Mercadian Masques',
    'Urza\'s Destiny',
    'Urza\'s Legacy',
    'Urza\'s Saga',
    'Exodus',
    'Stronghold',
    'Tempest',
    'Fifth Edition',
    'Weatherlight',
    'Visions',
    'Mirage',
    'Coldsnap',
    'Alliances',
    'Ice Age',
    'Homelands',
    'Fourth Edition',
    'Fallen Empires',
    'The Dark',
    'Legends',
    'Revised Edition',
    'Antiquities',
    'Arabian Nights',
    'Unlimited Edition',
    'Limited Edition Beta',
    'Limited Edition Alpha',
    'Portal Three Kingdoms',
    'Portal Second Age',
    'Portal',
    'Unhinged',
    'Unglued',
    'Magic: The Gathering-Commander'
  ]

  $scope.set1 = "Dragon's Maze";
  $scope.set2 = 'Gatecrash';
  $scope.set3 = 'Return to Ravnica';
  $scope.set4 = "Dragon's Maze";
  $scope.set5 = 'Gatecrash';
  $scope.set6 = 'Return to Ravnica';
  $scope.create = function() {
    var sets = [$scope.set1, $scope.set2, $scope.set3, $scope.set4, $scope.set5, $scope.set6];
    $http.post('/create', {
      sets: sets, type: $scope.type, size: $scope.size, bots: $scope.bots, cube: $scope.cube
    })
      .success(function(data, status) {
        $location.path('/q/' + data.id);
      })
      ;
  };
}

function QCtrl($scope, $timeout, $http, $routeParams, ws) {
  var selected = null

  document.getElementById('chat').style.display = 'none';
  $scope.beep = 'never';
  $scope.order = 'color';
  $scope.main = [];
  $scope.side = [];
  $scope.jank = [];
  $scope.land = [
  { land: true, cmc: 0, color: 'L', id: 73946, name: 'Forest'   },
  { land: true, cmc: 0, color: 'L', id: 73951, name: 'Island'   },
  { land: true, cmc: 0, color: 'L', id: 73958, name: 'Mountain' },
  { land: true, cmc: 0, color: 'L', id: 73963, name: 'Plains'   },
  { land: true, cmc: 0, color: 'L', id: 73973, name: 'Swamp'    }
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

  ws.on('open', function() {
    var qid = $routeParams.qid
    , pid = localStorage.pid
    , name = localStorage.name
    ;
    ws.json('init', qid, pid, name);
  });
  ws.on('apperror', function(error) {
    $scope.error = error;
    $scope.$apply();
  });
  ws.on('error', function(error) {
    console.error(error);
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
    var d = document
      , audio = d.querySelector('audio')
      , beep = $scope.beep
      , hidden = d.hidden || d.msHidden || d.mozHidden || d.webkitHidden
      ;
    if (pack) {
      pack.show = true;
      if (pack.cards.length && (
        (beep === 'always') ||
        ((beep === 'if tab is hidden') && hidden)))
          audio.play();
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
  ws.on('close', function() {
    $scope.end = true;
    $scope.$apply();
  });

  $scope.pick = function(card) {
    if (selected !== card) {
      selected = card
      return
    }
    ws.json('pick', $scope.pack.id, card.name);
    $scope.pack.show = false;
    selected = null
  };
  $scope.editName = function(player) {
    if (!player.self) return;
    player.edit = true;
  };
  $scope.name = function(name) {
    $scope.self.edit = false;
    name = name.slice(0, 15);
    ws.json('name', name);
    localStorage.name = name;
  };
  $scope.fromMain = function(card, e) {
    var main = $scope.main;
    main.splice(main.indexOf(card), 1);
    if (card.land) return;
    if (e.shiftKey)
      $scope.jank.push(card);
    else
      $scope.side.push(card);
  };
  $scope.fromSide = function(card, e) {
    var side = $scope.side;
    side.splice(side.indexOf(card), 1);
    if (card.land) return;
    if (e.shiftKey)
      $scope.jank.push(card);
    else
      $scope.main.push(card);
  };
  $scope.fromJank = function(card, e) {
    var jank = $scope.jank;
    jank.splice(jank.indexOf(card), 1);
    if (e.shiftKey)
      $scope.main.push(card);
    else
      $scope.side.push(card);
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
      , deck
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
    deck = {
      main: main,
      side: side
    };
    $scope.deckJSON = JSON.stringify(deck);
    ws.json('hash', deck);
  };
}
