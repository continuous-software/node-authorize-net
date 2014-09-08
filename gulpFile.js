var gulp = require('gulp');
var jsdox = require('jsdox');
var concat = require('gulp-concat');

gulp.task('documentation', function (done) {
    jsdox.generateForDir('./lib/AuthorizeNet.js', 'documentation', 'documentation/template', done);
});

gulp.task('readme', ['documentation'], function () {
    gulp.src(['./documentation/head.md', './documentation/AuthorizeNet.md', './documentation/foot.md'])
        .pipe(concat('readme.md'))
        .pipe(gulp.dest('./'));
});



