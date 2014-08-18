var spawn = require('child_process').spawn
var gulp = require('gulp')

try {
  var lr = require('gulp-livereload')
  var traceur = require('gulp-traceur')
} catch(err) {}

function build(e) {
  gulp.src(e.path)
  .pipe(traceur())
  .pipe(gulp.dest('public/out'))
  .pipe(lr({ auto: false }))
}

function run() {
  spawn('node', ['app.js'], { stdio: 'inherit' })
  .on('close', run)
}

gulp.task('run', run)

gulp.task('default', function() {
  spawn('node', ['app.js'], { stdio: 'inherit' })

  lr.listen()
  build({ path: 'public/src/*' })
  gulp.watch('public/src/*', build)
  gulp.watch(['public/style.css', 'public/index.html'], lr.changed)
})
