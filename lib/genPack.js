var Cards, Sets, ref$, choose, rand, genPack;
Cards = require('../data/cards');
Sets = require('../data/sets');
ref$ = require('./_'), choose = ref$.choose, rand = ref$.rand;
genPack = function(setName){
  var ref$, common, uncommon, rare, mythic, special, pack, index, i$, len$, name, results$ = [];
  ref$ = Sets[setName], common = ref$.common, uncommon = ref$.uncommon, rare = ref$.rare, mythic = ref$.mythic, special = ref$.special;
  mythic || (mythic = rare);
  if (!rand(8)) {
    rare = mythic;
  }
  pack = [].concat(choose(10, common), choose(3, uncommon), choose(1, rare));
  switch (setName) {
  case "Dragon's Maze":
    special = rand(22)
      ? special.gate
      : special.shock;
    // fallthrough
  case 'Time Spiral':
    index = rand(special.length);
    pack.push(special[index]);
  }
  for (i$ = 0, len$ = pack.length; i$ < len$; ++i$) {
    name = pack[i$];
    results$.push(Cards[name]);
  }
  return results$;
};
module.exports = genPack;