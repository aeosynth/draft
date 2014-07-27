var gulp = require('gulp');

var lr = require('gulp-livereload');
var react = require('gulp-react');

function log(e) {
  console.log(e.message);
}

gulp.task('build', function() {
  build({ path: 'public/src/*' });
});

function build(e) {
  gulp.src(e.path)
  .pipe(react({ harmony: true }))
  .on('error', log)
  .pipe(gulp.dest('public/js'))
  .pipe(lr({ auto: false }))
  ;
};

gulp.task('default', function() {
  gulp.watch('public/src/*', build);
  gulp.watch(['public/css/style.css', 'public/index.html'], lr.changed);

  lr.listen();
  build({ path: 'public/src/*' });
});
