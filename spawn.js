var spawn = require('child_process').spawn;

(function run() {
  console.log((new Date).toString());
  var app = spawn('node', ['app.js'], { stdio: 'inherit' });
  app.on('close', run);
})();
