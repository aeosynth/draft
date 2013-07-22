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
  var id = localStorage.id ||
    (localStorage.id = (Math.floor(Math.random() * 9e9)).toString(16));
  var options = { query: {
    id: id,
    name: localStorage.name,
    zone: localStorage.zone,
    room: location.pathname.split('/').pop()
  }};
  var ws = eio('ws://' + location.host, options);
  ws.msg = new eio.Emitter;
  ws.on('message', function(msg) {
    var data = JSON.parse(msg);
    ws.msg.emit(data.name, data.args);
    $rootScope.$apply();
  });
  ws.json = function() {
    var args = Array.prototype.slice.call(arguments);
    ws.send(JSON.stringify(args));
  };
  return ws;
})
.directive('autoselect', function() {
  return function(scope, el, attrs) {
    el.bind('click', function() {
      el[0].select();
    });
  };
})
.directive('save', function() {
  return function(scope, el, attrs) {
    // localStorage stores everything as strings, so use json
    var model = attrs.ngModel;
    var cur = localStorage[model];
    if (cur) {
      try {
        scope[model] = JSON.parse(cur);
      } catch (err) { }
    }
    scope.$watch(model, function(cur, old) {
      if (cur === old) return;
      localStorage[model] = JSON.stringify(cur);
    });
  };
});
;

function CreateCtrl($scope, $http, $location) {
  $scope.type = 'draft';
  $scope.seats = 8;

  $scope.sets = [
    'Alara Reborn',
    'Alliances',
    'Antiquities',
    'Apocalypse',
    'Arabian Nights',
    'Avacyn Restored',
    'Betrayers of Kamigawa',
    'Champions of Kamigawa',
    'Chronicles',
    'Classic Sixth Edition',
    'Coldsnap',
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
    'Magic 2014 Core Set',
    'Mercadian Masques',
    'Mirage',
    'Mirrodin',
    'Mirrodin Besieged',
    'Modern Masters',
    'Morningtide',
    'Nemesis',
    'New Phyrexia',
    'Ninth Edition',
    'Odyssey',
    'Onslaught',
    'Planar Chaos',
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

  $scope.set1 = 'Magic 2014 Core Set';
  $scope.set2 = 'Magic 2014 Core Set';
  $scope.set3 = 'Magic 2014 Core Set';
  $scope.set4 = 'Magic 2014 Core Set';
  $scope.set5 = 'Magic 2014 Core Set';
  $scope.set6 = 'Magic 2014 Core Set';
  $scope.create = function() {
    var id = localStorage.id || (localStorage.id = (Math.floor(Math.random() * 9e9)).toString(16));
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
        var cube = $scope.cube;
        if (cube)
          var match = cube.match(/([^/]+)\/?$/);
        if (!match)
          return alert('which cube are you drafting?');
        data.cube = $scope.cube = match[1];
    }
    $http.post('/create', data)
      .success(function(qid, status) {
        $location.path('/q/' + qid);
      })
      ;
  };
}

function QCtrl($scope, $timeout, ws) {
  var selected = null
  var audio = document.querySelector('audio');

  document.getElementById('chat').style.display = 'none';
  $scope.extension = 'dec';
  $scope.addBots = true;
  $scope.beep = 'never';
  $scope.order = 'color';
  $scope.zone = 'main';
  $scope.main = [];
  $scope.side = [];
  $scope.jank = [];
  $scope.mainLand = {
    b: 0,
    g: 0,
    r: 0,
    u: 0,
    w: 0
  };
  $scope.sideLand = {
    b: 0,
    g: 0,
    r: 0,
    u: 0,
    w: 0
  };

  var lands = {
    b: { land: true, cmc: 0, color: 'L', key: 'b', url: 'http://gatherer.wizards.com/Handlers/Image.ashx?type=card&multiverseid=73973', name: 'Swamp'    },
    g: { land: true, cmc: 0, color: 'L', key: 'g', url: 'http://gatherer.wizards.com/Handlers/Image.ashx?type=card&multiverseid=73946', name: 'Forest'   },
    r: { land: true, cmc: 0, color: 'L', key: 'r', url: 'http://gatherer.wizards.com/Handlers/Image.ashx?type=card&multiverseid=73958', name: 'Mountain' },
    u: { land: true, cmc: 0, color: 'L', key: 'u', url: 'http://gatherer.wizards.com/Handlers/Image.ashx?type=card&multiverseid=73951', name: 'Island'   },
    w: { land: true, cmc: 0, color: 'L', key: 'w', url: 'http://gatherer.wizards.com/Handlers/Image.ashx?type=card&multiverseid=73963', name: 'Plains'   }
  };
  function landFactory(zoneName) {
    return function(cur, old) {
      var zone = [];
      angular.forEach($scope[zoneName], function(val) {
        if (!val.land) zone.push(val);
      });
      angular.forEach(cur, function(val, key) {
        while (val--)
          zone.push(lands[key]);
      });
      $scope[zoneName] = zone;
    }
  }
  $scope.$watch('mainLand', landFactory('main'), true);
  $scope.$watch('sideLand', landFactory('side'), true);

  $scope.$watch('zone', function(cur, old) {
    if (cur === old) return;

    $scope[cur] = $scope.main.concat($scope.side);
    $scope[old] = [];

    ['b', 'g', 'r', 'u', 'w'].forEach(function(c) {
      var oldLand = $scope[old + 'Land'];
      $scope[cur + 'Land'][c] += oldLand[c];
      oldLand[c] = 0;
    });

    ws.json('zone', cur);
  });

  function decrement() {
    angular.forEach($scope.players, function(player) {
      if (player.time)
        --player.time;
    });
    $timeout(decrement, 1000);
  }

  $timeout(decrement, 1000);

  ws.on('open', function() {
    console.log('open');
  });
  ws.on('error', function(error) {
    console.log(error);
  });
  ws.on('close', function() {
    console.log('close');
  });

  var msg = ws.msg;
  msg.on('error', function(error) {
    $scope.error = error;
  });
  msg.on('set', function(data) {
    angular.extend($scope, data);

    if (!(data.pack && data.pack.length)) return;
    var d = document;
    var hidden = d.hidden || d.webkitHidden;
    switch ($scope.beep) {
      case 'if tab is hidden': if (!hidden) return;
      case 'always': audio.play();
    }
  });
  msg.on('add', function(card) {
    $scope[$scope.zone].push(card);
  });

  $scope.pick = function(index) {
    if (selected !== index) {
      selected = index;
      return;
    }
    $scope.pack = null;
    selected = null;
    ws.json('pick', index);
  };
  $scope.editName = function(p, index) {
    if ($scope.self === index)
      p.edit = true;
  };
  $scope.name = function(p) {
    p.edit = false;
    name = p.name.slice(0, 15);
    ws.json('name', name);
    localStorage.name = name;
  };
  $scope.fromMain = function(card, e) {
    var main = $scope.main;
    main.splice(main.indexOf(card), 1);
    if (card.land) {
      $scope.mainLand[card.key]--;
      return;
    }
    if (e.shiftKey)
      $scope.jank.push(card);
    else
      $scope.side.push(card);
  };
  $scope.fromSide = function(card, e) {
    var side = $scope.side;
    side.splice(side.indexOf(card), 1);
    if (card.land) {
      $scope.sideLand[card.key]--;
      return;
    }
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
    $scope.round = 1;
    ws.json('start', $scope.addBots);
  };
}
