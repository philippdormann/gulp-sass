# @philippdormann/gulp-sass
Sass plugin for [Gulp](https://github.com/gulpjs/gulp).

# Support
Ported to Node.js >= 17

# Install
```
yarn add -D @philippdormann/gulp-sass
```

# Basic Usage
Something like this will compile your Sass files:

```javascript
const gulp = require('gulp');
const sass = require('@philippdormann/gulp-sass');

sass.compiler = require('node-sass');

gulp.task('sass', function () {
  return gulp.src('./sass/**/*.scss')
    .pipe(sass())
    .pipe(gulp.dest('./css'));
});

gulp.task('sass:watch', function () {
  gulp.watch('./sass/**/*.scss', ['sass']);
});
```
