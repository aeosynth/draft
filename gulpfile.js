var spawn = require('child_process').spawn
var gulp = require('gulp')
var lr = require('gulp-livereload')
var traceur = require('gulp-traceur')

function log(e) {
  console.log(e.message)
}

function build(e) {
  gulp.src(e.path)
  .pipe(traceur())
  .on('error', log)
  .pipe(gulp.dest('public/out'))
  .pipe(lr({ auto: false }))
}

gulp.task('default', function() {
  spawn('node', ['app.js'], { stdio: 'inherit' })

  lr.listen()
  build({ path: 'public/src/*' })
  gulp.watch('public/src/*', build)
})
