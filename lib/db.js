var request, rand, couch;
request = require('request');
rand = require('./_').rand;
couch = require('../data/couch');
module.exports = function(data){
  var options;
  options = importAll$({}, couch);
  data._id = data.end + rand(1e9).toString(16).slice(-6);
  options.uri += data._id;
  options.json = data;
  return request(options, function(err, res, body){
    if (err) {
      throw err;
    }
    return console.log(body);
  });
};
function importAll$(obj, src){
  for (var key in src) obj[key] = src[key];
  return obj;
}