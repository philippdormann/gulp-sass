const chalk = require('chalk');
const PluginError = require('plugin-error');
const replaceExtension = require('replace-ext');
const through = require('through2');
const path = require('path');
const compiler = require('node-sass');
const stripAnsi = (input) => {
  return input.replace(
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
}

const PLUGIN_NAME = 'gulp-sass';

// Main Gulp Sass function
const gulpSass = (options, sync) => through.obj((file, enc, cb) => {
  if (file.isNull()) {
    return cb(null, file);
  }

  if (file.isStream()) {
    return cb(new PluginError(PLUGIN_NAME, 'Streaming not supported'));
  }

  if (path.basename(file.path).indexOf('_') === 0) {
    return cb();
  }

  if (!file.contents.length) {
    file.path = replaceExtension(file.path, '.css');
    return cb(null, file);
  }

  let opts = {}
  Object.assign(opts, (options || {}))
  opts.data = file.contents.toString();

  // we set the file path here so that libsass can correctly resolve import paths
  opts.file = file.path;

  // Ensure `indentedSyntax` is true if a `.sass` file
  if (path.extname(file.path) === '.sass') {
    opts.indentedSyntax = true;
  }

  // Ensure file's parent directory in the include path
  if (opts.includePaths) {
    if (typeof opts.includePaths === 'string') {
      opts.includePaths = [opts.includePaths];
    }
  } else {
    opts.includePaths = [];
  }

  opts.includePaths.unshift(path.dirname(file.path));

  /**
   * Handles returning the file to the stream
   */
  const filePush = (sassObj) => {
    file.contents = sassObj.css;
    file.path = replaceExtension(file.path, '.css');

    if (file.stat) {
      file.stat.atime = file.stat.mtime = file.stat.ctime = new Date();
    }

    cb(null, file);
  };

  /**
   * Handles error message
   */
  const errorM = (error) => {
    const filePath = (error.file === 'stdin' ? file.path : error.file) || file.path;
    const relativePath = path.relative(process.cwd(), filePath);
    const message = [chalk.underline(relativePath), error.formatted].join('\n');

    error.messageFormatted = message;
    error.messageOriginal = error.message;
    error.message = stripAnsi(message);
    error.relativePath = relativePath;

    return cb(new PluginError(PLUGIN_NAME, error));
  };

  if (sync !== true) {
    // Async Sass render
    const callback = (error, obj) => {
      if (error) {
        return errorM(error);
      }
      filePush(obj);
    };

    compiler.render(opts, callback);
  } else {
    // Sync Sass render
    try {
      filePush(compiler.renderSync(opts));
    } catch (error) {
      return errorM(error);
    }
  }
});

// Sync Sass render
gulpSass.sync = options => gulpSass(options, true);

// Log errors nicely
gulpSass.logError = function logError(error) {
  const message = new PluginError('sass', error.messageFormatted).toString();
  process.stderr.write(`${message}\n`);
  this.emit('end');
};

module.exports = gulpSass;
