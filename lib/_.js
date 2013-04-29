var rand, _;
rand = function(it){
  return Math.random() * it | 0;
};
module.exports = _ = {
  next: function(arr, delta, index){
    var length;
    length = arr.length;
    index = (index + delta + length) % length;
    return arr[index];
  },
  rand: rand,
  shuffle: function(arr){
    return _.choose(arr.length, arr);
  },
  choose: function(n, arr){
    var i, end, j, ref$;
    i = arr.length;
    end = i - n || 1;
    while (i > end) {
      j = rand(i--);
      ref$ = [arr[j], arr[i]], arr[i] = ref$[0], arr[j] = ref$[1];
    }
    return arr.slice(-n);
  }
};