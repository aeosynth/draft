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
.factory('ws', function($rootScope) {
  var ws = new SockJS('/sock');
  ws.onmessage = function(e) {
    $rootScope.$apply(function() {
      var data = JSON.parse(e.data);
      ws.cb[data.name].call(null, data.args);
    });
  };
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
  $scope.cards = 15;
  $scope.packs = 3;

  $scope.sets = {
    "Portal": "POR",
    "Portal Second Age": "PO2",
    "Portal Three Kingdoms": "PTK",
    "Starter 1999": "S99",
    "Unglued": "UGL",
    "Unhinged": "UNH",
    "Modern Masters": "MMA",

    "Limited Edition Alpha": "LEA",
    "Limited Edition Beta": "LEB",
    "Unlimited Edition": "2ED",
    "Revised Edition": "3ED",
    "Fourth Edition": "4ED",
    "Fifth Edition": "5ED",
    "Classic Sixth Edition": "6ED",
    "Seventh Edition": "7ED",
    "Eighth Edition": "8ED",
    "Ninth Edition": "9ED",
    "Tenth Edition": "10E",
    "Magic 2010": "M10",
    "Magic 2011": "M11",
    "Magic 2012": "M12",
    "Magic 2013": "M13",
    "Magic 2014 Core Set": "M14",

    "Arabian Nights": "ARN",
    "Antiquities": "ATQ",
    "Legends": "LEG",
    "The Dark": "DRK",
    "Fallen Empires": "FEM",
    "Ice Age": "ICE",
    "Chronicles": "CHR",
    "Homelands": "HML",
    "Alliances": "ALL",
    "Mirage": "MIR",
    "Visions": "VIS",
    "Weatherlight": "WTH",
    "Tempest": "TMP",
    "Stronghold": "STH",
    "Exodus": "EXO",
    "Urza's Saga": "USG",
    "Urza's Legacy": "ULG",
    "Urza's Destiny": "UDS",
    "Mercadian Masques": "MMQ",
    "Nemesis": "NMS",
    "Prophecy": "PCY",
    "Invasion": "INV",
    "Planeshift": "PLS",
    "Apocalypse": "APC",
    "Odyssey": "ODY",
    "Torment": "TOR",
    "Judgment": "JUD",
    "Onslaught": "ONS",
    "Legions": "LGN",
    "Scourge": "SCG",
    "Mirrodin": "MRD",
    "Darksteel": "DST",
    "Fifth Dawn": "5DN",
    "Champions of Kamigawa": "CHK",
    "Betrayers of Kamigawa": "BOK",
    "Saviors of Kamigawa": "SOK",
    "Ravnica: City of Guilds": "RAV",
    "Guildpact": "GPT",
    "Dissension": "DIS",
    "Coldsnap": "CSP",
    "Time Spiral": "TSP",
    "Planar Chaos": "PLC",
    "Future Sight": "FUT",
    "Lorwyn": "LRW",
    "Morningtide": "MOR",
    "Shadowmoor": "SHM",
    "Eventide": "EVE",
    "Shards of Alara": "ALA",
    "Conflux": "CON",
    "Alara Reborn": "ARB",
    "Zendikar": "ZEN",
    "Worldwake": "WWK",
    "Rise of the Eldrazi": "ROE",
    "Scars of Mirrodin": "SOM",
    "Mirrodin Besieged": "MBS",
    "New Phyrexia": "NPH",
    "Innistrad": "ISD",
    "Dark Ascension": "DKA",
    "Avacyn Restored": "AVR",
    "Return to Ravnica": "RTR",
    "Gatecrash": "GTC",
    "Dragon's Maze": "DGM",
    "Theros": "THS",
    "Born of the Gods": "BNG",
    "Journey into Nyx": "JOU"
  };

  $scope.set1 = 'JOU';
  $scope.set2 = 'BNG';
  $scope.set3 = 'THS';
  $scope.set4 = 'JOU';
  $scope.set5 = 'BNG';
  $scope.set6 = 'THS';
  $scope.create = function() {
    var id = localStorage.id || (localStorage.id = (Math.floor(Math.random() * 9e9)).toString(16));
    var type = $scope.type;

    var data = {
      type: type, seats: Number($scope.seats), host: id
    };
    if ((type === 'draft') || (type === 'sealed')) {
      data.sets = [$scope.set1, $scope.set2, $scope.set3];
      if (type === 'sealed')
        data.sets = data.sets.concat([$scope.set4, $scope.set5, $scope.set6]);
    }
    else {
      var list = $scope.list
        .split('\n')
        .map(function(x) { return x.trim(); })
        .filter(function(x) { return x.length; })
        ;

      var cards = Number($scope.cards);
      var packs = Number($scope.packs);

      var min = 720;
      if (type === 'cube draft')
        min = cards * packs * data.seats;
      if (min > list.length || list.length > 1e3)
        return alert('this cube needs between ' + min + ' and 1000 cards; it has ' + list.length);

      data.type = data.type.replace(' ', '_');
      data.cube = {
        list: list,
        cards: cards,
        packs: packs
      };
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

function QCtrl($scope, $timeout, $location, $routeParams, ws) {
  var selected = null
  var audio = document.querySelector('audio');

  $scope.state = 'open';
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
    b: { land: true, cmc: 0, code: 'UNH', color: 'L', key: 'b', url: 'http://gatherer.wizards.com/Handlers/Image.ashx?type=card&multiverseid=73973', name: 'Swamp'    },
    g: { land: true, cmc: 0, code: 'UNH', color: 'L', key: 'g', url: 'http://gatherer.wizards.com/Handlers/Image.ashx?type=card&multiverseid=73946', name: 'Forest'   },
    r: { land: true, cmc: 0, code: 'UNH', color: 'L', key: 'r', url: 'http://gatherer.wizards.com/Handlers/Image.ashx?type=card&multiverseid=73958', name: 'Mountain' },
    u: { land: true, cmc: 0, code: 'UNH', color: 'L', key: 'u', url: 'http://gatherer.wizards.com/Handlers/Image.ashx?type=card&multiverseid=73951', name: 'Island'   },
    w: { land: true, cmc: 0, code: 'UNH', color: 'L', key: 'w', url: 'http://gatherer.wizards.com/Handlers/Image.ashx?type=card&multiverseid=73963', name: 'Plains'   }
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

  ws.onopen = function() {
    console.log('open');

    var id = localStorage.id ||
      (localStorage.id = (Math.floor(Math.random() * 9e9)).toString(16));
    try { var zone = JSON.parse(localStorage.zone); }
    catch (err) { }

    var options = {
      id: id,
      name: localStorage.name,
      zone: zone,
      room: $routeParams.qid
    };

    ws.json('join', options);
  };
  ws.onerror = function(error) {
    console.log(error);
  };
  ws.onclose = function() {
    console.log('close');
  };

  ws.cb = {
    error: function(error) {
      $location.path('/err/' + error);
    },
    set: function(data) {
      angular.extend($scope, data);

      if (!(data.pack && data.pack.length)) return;
      var d = document;
      var hidden = d.hidden || d.webkitHidden;
      switch ($scope.beep) {
        case 'if tab is hidden': if (!hidden) return;
        case 'always': audio.play();
      }
    },
    add: function(card) {
      $scope[$scope.zone].push(card);
    }
  };

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
      , code = {}
      , deck
      ;

    angular.forEach($scope.main, function(card) {
      var name = card.name;
      code[name] = card.code;
      main[name] || (main[name] = 0);
      main[name] += 1;
    });
    angular.forEach($scope.side, function(card) {
      var name = card.name;
      code[name] = card.code;
      side[name] || (side[name] = 0);
      side[name] += 1;
    });

    return {
      main: main,
      side: side,
      code: code
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
    mwdeck: function(deck) {
      var arr = [];
      var code = deck.code;
      angular.forEach(deck.main, function(n, name) {
        arr.push(n + ' [' + code[name] + '] ' + name);
      });
      angular.forEach(deck.side, function(n, name) {
        arr.push('SB: ' + n + ' [' + code[name] + '] ' + name);
      });
      return arr.join('\r\n');
    },
    json: function(deck) {
      delete deck.code;
      return JSON.stringify(deck);
    }
  };

  $scope.start = function() {
    if (!$scope.isHost) return;
    $scope.state = 'started';
    ws.json('start', $scope.addBots);
  };
  $scope.getCap = function() {
    if ($scope.cap) return;
    $scope.cap = 'loading...';
    ws.json('getCap');
  };
}
