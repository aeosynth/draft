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
.factory('ws', function($rootScope) {
  var id = localStorage.pid || (localStorage.id = Math.floor(Math.random() * 1e8));
  var name = localStorage.name;
  var room = location.pathname.split('/').pop();
  var ws = eio('ws://' + location.host, { query: { id: id, name: name, room: room }});
  ws.on('message', function(msg) {
    var data = JSON.parse(msg);
    ws.emit(data.name, data.args);
    $rootScope.$apply();
  });
  ws.json = function() {
    var args = Array.prototype.slice.call(arguments);
    ws.send(JSON.stringify(args));
  };
  return ws;
})
;

function CreateCtrl($scope, $http, $location) {
  $scope.cube = 'mtgo holiday';
  $scope.type = 'draft';
  $scope.seats = 8;

  $scope.sets = [
    'Alara Reborn',
    'Alliances',
    'Antiquities',
    'Apocalypse',
    'Arabian Nights',
    'Archenemy',
    'Avacyn Restored',
    'Betrayers of Kamigawa',
    'Champions of Kamigawa',
    'Chronicles',
    'Classic Sixth Edition',
    'Coldsnap',
    'Commander\'s Arsenal',
    'Conflux',
    'Dark Ascension',
    'Darksteel',
    'Dissension',
    'Dragon\'s Maze',
    'Eighth Edition',
    'Eventide',
    'Exodus',
    'Fallen Empires',
    'Fifth Dawn',
    'Fifth Edition',
    'Fourth Edition',
    'Future Sight',
    'Gatecrash',
    'Guildpact',
    'Homelands',
    'Ice Age',
    'Innistrad',
    'Invasion',
    'Judgment',
    'Legends',
    'Legions',
    'Limited Edition Alpha',
    'Limited Edition Beta',
    'Lorwyn',
    'Magic 2010',
    'Magic 2011',
    'Magic 2012',
    'Magic 2013',
    'Magic: The Gathering-Commander',
    'Mercadian Masques',
    'Mirage',
    'Mirrodin',
    'Mirrodin Besieged',
    'Morningtide',
    'Nemesis',
    'New Phyrexia',
    'Ninth Edition',
    'Odyssey',
    'Onslaught',
    'Planar Chaos',
    'Planechase',
    'Planechase 2012 Edition',
    'Planeshift',
    'Portal',
    'Portal Second Age',
    'Portal Three Kingdoms',
    'Prophecy',
    'Ravnica: City of Guilds',
    'Return to Ravnica',
    'Revised Edition',
    'Rise of the Eldrazi',
    'Saviors of Kamigawa',
    'Scars of Mirrodin',
    'Scourge',
    'Seventh Edition',
    'Shadowmoor',
    'Shards of Alara',
    'Starter 1999',
    'Starter 2000',
    'Stronghold',
    'Tempest',
    'Tenth Edition',
    'The Dark',
    'Time Spiral',
    'Torment',
    'Unglued',
    'Unhinged',
    'Unlimited Edition',
    'Urza\'s Destiny',
    'Urza\'s Legacy',
    'Urza\'s Saga',
    'Visions',
    'Weatherlight',
    'Worldwake',
    'Zendikar'
  ];

  $scope.set1 = "Dragon's Maze";
  $scope.set2 = 'Gatecrash';
  $scope.set3 = 'Return to Ravnica';
  $scope.set4 = "Dragon's Maze";
  $scope.set5 = 'Gatecrash';
  $scope.set6 = 'Return to Ravnica';
  $scope.create = function() {
    var id = localStorage.pid || (localStorage.id = Math.floor(Math.random() * 1e8));
    var data = {
      type: $scope.type, seats: $scope.seats, host: id
    };
    switch(data.type) {
      case 'draft':
        data.sets = [$scope.set1, $scope.set2, $scope.set3];
        break;
      case 'sealed':
        data.sets = [$scope.set1, $scope.set2, $scope.set3, $scope.set4, $scope.set5, $scope.set6];
        break;
      case 'cube':
        data.cube = $scope.cube;
    }
    $http.post('/create', data)
      .success(function(qid, status) {
        $location.path('/q/' + qid);
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
  { land: true, cmc: 0, color: 'L', url: 'http://gatherer.wizards.com/Handlers/Image.ashx?type=card&multiverseid=73946', name: 'Forest'   },
  { land: true, cmc: 0, color: 'L', url: 'http://gatherer.wizards.com/Handlers/Image.ashx?type=card&multiverseid=73951', name: 'Island'   },
  { land: true, cmc: 0, color: 'L', url: 'http://gatherer.wizards.com/Handlers/Image.ashx?type=card&multiverseid=73958', name: 'Mountain' },
  { land: true, cmc: 0, color: 'L', url: 'http://gatherer.wizards.com/Handlers/Image.ashx?type=card&multiverseid=73963', name: 'Plains'   },
  { land: true, cmc: 0, color: 'L', url: 'http://gatherer.wizards.com/Handlers/Image.ashx?type=card&multiverseid=73973', name: 'Swamp'    }
  ];

  function decrement() {
    angular.forEach($scope.players, function(player) {
      if (player.time)
        --player.time;
    });
    $timeout(decrement, 1000);
  }

  $timeout(decrement, 1000);

  ws.on('open', function() {
    var qid = $routeParams.qid;
    ws.json('join', qid);
  });
  ws.on('error', function(error) {
    console.error(error);
  });
  ws.on('set', function(data) {
    angular.extend($scope, data);
  });
  ws.on('add', function(card) {
    $scope.main.push(card);
  });

  /*
  ws.on('meta', function(meta) {
    var players = meta.players
      , index = meta.index
      , ended = meta.ended
      , seats = meta.seats
      , oppIndex
      ;
    if (seats === 8)// XXX magic
      oppIndex = (index + (seats/2)) % seats;
    while(seats > players.length)
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
  });
  */
  ws.on('close', function() {
    $scope.end = true;
    $scope.$apply();
  });

  $scope.pick = function(index) {
    if (selected !== index) {
      selected = index
      return
    }
    ws.json('pick', index);
    $scope.pack = null;
    selected = null;
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
  $scope.start = function() {
    if (!$scope.isHost) return;
    ws.json('start', $scope.addBots);
  };
}
