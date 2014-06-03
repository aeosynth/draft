function maybe(path) {
  try {
    return require(path);
  } catch(err) {}
}

var raw = maybe('./AllSets'),
    Cards = maybe('./cards')
    Sets = maybe('./sets');

module.exports = {
  raw: raw,
  Cards: Cards,
  Sets: Sets,
  mws: require('./mws'),
  spoiler: require('./spoiler'),
  couch: require('./couch')
};
