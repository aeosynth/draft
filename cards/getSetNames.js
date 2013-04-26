var request, cheerio, getSetNames, parse;
request = require('request');
cheerio = require('cheerio');
getSetNames = function(cb){
  return request('http://gatherer.wizards.com/Pages/Default.aspx', function(err, res, html){
    var setNames;
    if (err) {
      return cb(err);
    } else {
      setNames = parse(html);
      return cb(null, setNames);
    }
  });
};
parse = function(html){
  var setNames, $;
  setNames = [];
  $ = cheerio.load(html);
  $('#ctl00_ctl00_MainContent_Content_SearchControls_setAddText option').each(function(){
    var that;
    if (that = $(this).text().trim()) {
      return setNames.push(that);
    }
  });
  return setNames;
};
module.exports = getSetNames;