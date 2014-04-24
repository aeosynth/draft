angular
.module('app', [], function($routeProvider, $locationProvider) {
  $locationProvider.html5Mode(true);

  $routeProvider
    .when('/', {
      templateUrl: '/partials/create.html',
      controller: CreateCtrl
    })
    .when('/err/:err', {
      templateUrl: '/partials/err.html',
      controller: ErrCtrl
    })
    .when('/q/:qid', {
      templateUrl: '/partials/q.html',
      controller: QCtrl
    })
    .when('/help', {
      templateUrl: '/partials/help.html'
    })
    ;
})
.factory('ws', function($rootScope, $routeParams) {
  var id = localStorage.id ||
    (localStorage.id = (Math.floor(Math.random() * 9e9)).toString(16));
  try { var zone = JSON.parse(localStorage.zone); }
  catch (err) { }
  var options = { query: {
    id: id,
    name: localStorage.name,
    zone: zone,
    room: $routeParams.qid
  }};
  var ws = eio('ws://' + location.host, options);
  ws.msg = new eio.Emitter;
  ws.on('message', function(msg) {
    $rootScope.$apply(function() {
      var data = JSON.parse(msg);
      ws.msg.emit(data.name, data.args);
    });
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

function ErrCtrl($scope, $routeParams) {
  $scope.err = $routeParams.err;
}

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
    'Born of the Gods',
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
    'Journey into Nyx',
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
    'Stronghold',
    'Tempest',
    'Tenth Edition',
    'The Dark',
    'Theros',
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

  $scope.set1 = 'Journey into Nyx';
  $scope.set2 = 'Born of the Gods';
  $scope.set3 = 'Theros';
  $scope.set4 = 'Journey into Nyx';
  $scope.set5 = 'Born of the Gods';
  $scope.set6 = 'Theros';
  $scope.create = function() {
    var id = localStorage.id || (localStorage.id = (Math.floor(Math.random() * 9e9)).toString(16));
    var type = $scope.type;

    var data = {
      type: type, seats: $scope.seats, host: id
    };
    switch(data.type) {
      case 'draft':
        data.sets = [$scope.set1, $scope.set2, $scope.set3];
        break;
      case 'sealed':
        data.sets = [$scope.set1, $scope.set2, $scope.set3, $scope.set4, $scope.set5, $scope.set6];
        break;
      default: // cube
        var cube = $scope.cube.trim();
        var split = cube
          .split('\n')
          .map(function(x) { return x.trim(); })
          .filter(function(x) { return x.length; })
          .sort()
          ;

        var min = 360;
        if (type === 'cube sealed')
          min = 720;
        if (min > split.length || split.length > 1e3)
          return alert('cubes must have at least 360 cards for draft, 720 for sealed; at most 1000 for either');

        var prev = null;
        for (var i = 0, l = split.length; i < l; i++) {
          var name = split[i];
          if (name === prev)
            return alert('duplicate card found: ' + name);
          prev = name;
        }

        data.type = data.type.replace(' ', '_');
        data.cube = cube;
    }
    $http.post('/create', data)
      .success(function(qid, status) {
        $location.path('/q/' + qid);
      })
      .error(function(err, status) {
        $location.path('/err/' + err);
      })
      ;
  };
}

function QCtrl($scope, $timeout, $location, ws) {
  var selected = null
  var audio = document.querySelector('audio');

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
      if (cur === old) return;

      var zone = [];
      angular.forEach($scope[zoneName], function(val) {
        if (!val.land) zone.push(val);
      });
      angular.forEach(cur, function(val, key) {
        while (val--)
          zone.push(lands[key]);
      });
      $scope[zoneName] = zone;
    };
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
    $location.path('/err/' + error);
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

  $scope.download = function() {
    var deck = generateRaw();
    var str = generate[$scope.extension](deck);
    str = encodeURIComponent(str);

    var a = document.createElement('a');
    a.href = 'data:,' + str;
    a.download = 'draft.' + $scope.extension;
    a.hidden = true;
    document.body.appendChild(a);
    a.click();
    a.remove();

    if (!$scope.hash)
      ws.json('hash', deck);
  };

  $scope.copy = function() {
    var deck = generateRaw();
    var str = generate.dec(deck);
    $scope.deck = str;
    $timeout(function() {
      document.getElementById('copy').select();
    });

    if (!$scope.hash)
      ws.json('hash', deck);
  };

  function generateRaw() {
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

    return {
      main: main,
      side: side
    };
  }

  var generate = {
    cod: function(deck) {
      function f(it) {
        var s = '';
        for (name in it)
          s += '    <card number="' + it[name] + '" name="' + name + '"/>\r\n';
        return s;
      }
      var s =
        '<?xml version="1.0" encoding="UTF-8"?>\r\n' +
        '<cockatrice_deck version="1">\r\n' +
        '  <deckname>draft</deckname>\r\n' +
        '  <zone name="main">\r\n' +
           f(deck.main) +
        '  </zone>\r\n' +
        '  <zone name="side">\r\n' +
           f(deck.side) +
        '  </zone>\r\n' +
        '</cockatrice_deck>'
        ;
      return s;
    },
    dec: function(deck) {
      var arr = [];
      angular.forEach(deck.main, function(n, name) {
        arr.push(n + ' ' + name);
      });
      angular.forEach(deck.side, function(n, name) {
        arr.push('SB: ' + n + ' ' + name);
      });
      return arr.join('\r\n');
    },
    json: function(deck) {
      return JSON.stringify(deck);
    }
  };

  $scope.start = function() {
    if (!$scope.isHost) return;
    $scope.round = 1;
    ws.json('start', $scope.addBots);
  };
  $scope.getCap = function() {
    if ($scope.cap) return;
    $scope.cap = 'loading...';
    ws.json('getCap');
  };
}
