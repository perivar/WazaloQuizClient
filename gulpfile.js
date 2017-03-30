var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
	cleanCSS = require('gulp-clean-css'),
	rename = require('gulp-rename'),
    util = require('gulp-util'),
    imagemin = require('gulp-imagemin'),
	replace = require('gulp-replace'),
	htmlmin  = require('gulp-htmlmin'),
	htmlreplace = require('gulp-html-replace');
	
gulp.task('build', ['minify-js', 'minify-css', 'minify-image', 'html-replace', 'copy-static']);

gulp.task('minify-js', function() {
  gulp.src(['src/js/quiz.js'])
  .pipe(uglify())
  .on('error', util.log)
  .pipe(rename({
    extname: '.min.js'
  }))
  .pipe(gulp.dest('build/js'));
});

gulp.task('minify-css', function () {
  gulp.src('src/css/quiz.css') 
  .pipe(cleanCSS({compatibility: 'ie8'}))
  .on('error', util.log)
  .pipe(rename({
    extname: '.min.css'
  }))
  .pipe(gulp.dest('build/css'));
  
  gulp.src('src/css/style.css') 
  .pipe(cleanCSS({compatibility: 'ie8'}))
  .on('error', util.log)
  .pipe(rename({
    extname: '.min.css'
  }))
  .pipe(gulp.dest('build/css'));  
});

gulp.task('minify-image', function () {
  gulp.src('src/images/**/*')
  .pipe(imagemin())
  .pipe(gulp.dest('build/images'));
});

gulp.task('html', function() {
  gulp.src('src/index.html')
  .pipe(htmlreplace({
   'css': 'css/quiz.min.css',
   'js': 'js/quiz.min.js'
  }))
  .pipe(htmlmin({
	  collapseWhitespace: false, 
	  minifyJS: true,
	  removeRedundantAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true
	  }))
  .pipe(gulp.dest('build/'));
});

gulp.task('html-replace', function() {
  gulp.src('src/index.html')
  .pipe(replace(/quiz\.css/g, 'quiz.min.css'))
  .pipe(replace(/style\.css/g, 'style.min.css'))
  .pipe(replace(/quiz\.js/g, 'quiz.min.js'))
  .pipe(replace(/images\//g, 'http://server.wazalo.com/WazaloQuizClient/images/')) 
  .pipe(htmlmin({
	  collapseWhitespace: true, 
	  minifyJS: true,
	  removeRedundantAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true
	  }))
  .pipe(gulp.dest('build/'));
});

// Copy all static assets
gulp.task('copy-static', function() {
  gulp.src(['src/js/**/*.js', '!src/js/**/quiz.js'])
  .pipe(gulp.dest('build/js'));

  gulp.src(['src/css/**/*.css', '!src/css/**/quiz.css', '!src/css/**/style.css'])
  .pipe(gulp.dest('build/css'));
});
		
gulp.task('default', ['build']);