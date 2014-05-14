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

  var setMap = {
    "Journey into Nyx": "JOU",
    "Born of the Gods": "BNG",
    "Theros": "THS",
    "Dragon's Maze": "DGM",
    "Gatecrash": "GTC",
    "Return to Ravnica": "RTR",
    "Avacyn Restored": "AVR",
    "Dark Ascension": "DKA",
    "Innistrad": "ISD",
    "New Phyrexia": "NPH",
    "Mirrodin Besieged": "MBS",
    "Scars of Mirrodin": "SOM",
    "Rise of the Eldrazi": "ROE",
    "Worldwake": "WWK",
    "Zendikar": "ZEN",
    "Alara Reborn": "ARB",
    "Conflux": "CON",
    "Shards of Alara": "ALA",
    "Eventide": "EVE",
    "Shadowmoor": "SHM",
    "Morningtide": "MOR",
    "Lorwyn": "LRW",
    "Future Sight": "FUT",
    "Planar Chaos": "PLC",
    "Time Spiral": "TSP",
    "Coldsnap": "CSP",
    "Dissension": "DIS",
    "Guildpact": "GPT",
    "Ravnica: City of Guilds": "RAV",
    "Saviors of Kamigawa": "SOK",
    "Betrayers of Kamigawa": "BOK",
    "Champions of Kamigawa": "CHK",
    "Fifth Dawn": "5DN",
    "Darksteel": "DST",
    "Mirrodin": "MRD",
    "Scourge": "SCG",
    "Legions": "LGN",
    "Onslaught": "ONS",
    "Judgment": "JUD",
    "Torment": "TOR",
    "Odyssey": "ODY",
    "Apocalypse": "APC",
    "Planeshift": "PLS",
    "Invasion": "INV",
    "Prophecy": "PCY",
    "Nemesis": "NMS",
    "Mercadian Masques": "MMQ",
    "Urza's Destiny": "UDS",
    "Urza's Legacy": "ULG",
    "Urza's Saga": "USG",
    "Exodus": "EXO",
    "Stronghold": "STH",
    "Tempest": "TMP",
    "Weatherlight": "WTH",
    "Visions": "VIS",
    "Mirage": "MIR",
    "Alliances": "ALL",
    "Homelands": "HML",
    "Chronicles": "CHR",
    "Ice Age": "ICE",
    "Fallen Empires": "FEM",
    "The Dark": "DRK",
    "Legends": "LEG",
    "Antiquities": "ATQ",
    "Arabian Nights": "ARN",

    "Magic 2014 Core Set": "M14",
    "Magic 2013": "M13",
    "Magic 2012": "M12",
    "Magic 2011": "M11",
    "Magic 2010": "M10",
    "Tenth Edition": "10E",
    "Ninth Edition": "9ED",
    "Eighth Edition": "8ED",
    "Seventh Edition": "7ED",
    "Classic Sixth Edition": "6ED",
    "Fifth Edition": "5ED",
    "Fourth Edition": "4ED",
    "Revised Edition": "3ED",
    "Unlimited Edition": "2ED",
    "Limited Edition Beta": "LEB",
    "Limited Edition Alpha": "LEA",

    "Modern Masters": "MMA",
    "Unhinged": "UNH",
    "Unglued": "UGL",
    "Starter 1999": "S99",
    "Portal Three Kingdoms": "PTK",
    "Portal Second Age": "PO2",
    "Portal": "POR"
  };

  // XXX technically the order is undefined
  $scope.sets = Object.keys(setMap);

  $scope.set1 = 'Journey into Nyx';
  $scope.set2 = 'Born of the Gods';
  $scope.set3 = 'Theros';
  $scope.set4 = 'Journey into Nyx';
  $scope.set5 = 'Born of the Gods';
  $scope.set6 = 'Theros';
  $scope.create = function() {
    var id = localStorage.id || (localStorage.id = (Math.floor(Math.random() * 9e9)).toString(16));
    var type = $scope.type;

    var seats = Number($scope.seats);
    var data = {
      type: type, seats: seats, host: id
    };
    if ((type === 'draft') || (type === 'sealed')) {
      var sets = [$scope.set1, $scope.set2, $scope.set3];
      if (type === 'sealed')
        sets = sets.concat([$scope.set4, $scope.set5, $scope.set6]);
      data.sets = sets.map(function(name) { return setMap[name]; });
    }
    else {
      var list = $scope.list
        .split('\n')
        .map(function(x) { return x.trim(); })
        .filter(function(x) { return x.length; })
        ;

      var cards = Number($scope.cards);
      var packs = Number($scope.packs);

      var min;
      if (type === 'cube draft')
        min = seats * cards * packs;
      else
        min = seats * 90;
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

  $scope.filename = 'filename';
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
    w: { land: true, cmc: 0, code: 'UNH', color: 'A', key: 'w', url: 'http://mtgimage.com/multiverseid/73963.jpg', name: 'Plains'   },
    u: { land: true, cmc: 0, code: 'UNH', color: 'A', key: 'u', url: 'http://mtgimage.com/multiverseid/73951.jpg', name: 'Island'   },
    b: { land: true, cmc: 0, code: 'UNH', color: 'A', key: 'b', url: 'http://mtgimage.com/multiverseid/73973.jpg', name: 'Swamp'    },
    r: { land: true, cmc: 0, code: 'UNH', color: 'A', key: 'r', url: 'http://mtgimage.com/multiverseid/73958.jpg', name: 'Mountain' },
    g: { land: true, cmc: 0, code: 'UNH', color: 'A', key: 'g', url: 'http://mtgimage.com/multiverseid/73946.jpg', name: 'Forest'   }
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
    a.download = $scope.filename + '.' + $scope.extension;
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
