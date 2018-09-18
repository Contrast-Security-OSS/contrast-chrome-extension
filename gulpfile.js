const gulp = require('gulp');
// const uglify = require('gulp-uglify');
const uglify = require('gulp-uglify-es').default;
const pump = require('pump');

console.log("Running Gulp");

gulp.task('default', ['compress'])

gulp.task('compress', function (cb) {
  console.log("Gulp Compressing");
  pump([
        gulp.src('js/**/*.js'),
        uglify({
          warnings: "verbose",
        }),
        gulp.dest('dist/js')
    ],
    cb
  );
});

// function callback() {
//   console.log("Gulp Callback");
// }
// gulp.tasks.compress.fn(callback);
