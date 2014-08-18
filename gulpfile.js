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

gulp.task('build', function() {
  build({ path: 'public/src/*' })
})

function run() {
  spawn('node', ['app.js'], { stdio: 'inherit' })
  .on('close', run)
}

gulp.task('run', run)

gulp.task('default', ['build'], function() {
  spawn('node', ['app.js'], { stdio: 'inherit' })

  lr.listen()
  gulp.watch('public/src/*', build)
  gulp.watch(['public/style.css', 'public/index.html'], lr.changed)
})
