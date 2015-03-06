// Include gulp
var gulp = require('gulp');

// Include Our Plugins
var jshint = require('gulp-jshint');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var mocha = require('gulp-mocha');
//var nodemon = require('gulp-nodemon');

// Lint Tasks
gulp.task('lint', function() {
    return gulp.src(['lib/**/*.js'])
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

gulp.task('develop', function () {
/*
  nodemon({
    script: 'app.js',
    ext: 'html js',
    env: { 'NODE_ENV': 'development' }
  })
    .on('restart', function () {
      console.log('restarted!')
    })
*/
});

gulp.task('test', function () {
    gulp.src('test/**/*.js')
        .pipe(mocha({
            reporter: 'nyan',
            clearRequireCache: true,
            ignoreLeaks: true
        }));
});

// Watch Files For Changes
gulp.task('watch', function() {
    gulp.watch('lib/**/*.js', ['lint']);
    gulp.watch(['test/**/*.js'], ['lint', 'test']);
});

// Default Task
//gulp.task('default', ['lint', 'test', 'develop', 'watch']);
gulp.task('default', ['test']);
