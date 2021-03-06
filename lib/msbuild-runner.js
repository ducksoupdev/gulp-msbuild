/* global process */
'use strict';

var commandBuilder = require('./msbuild-command-builder');
var gutil = require('gulp-util');
var childProcess = require('child_process');

module.exports.startMsBuildTask = function (options, file, callback) {
  var command = commandBuilder.construct(file, options);

  if (options.logCommand) {
    gutil.log("Using msbuild command: " + command.executable + (command.filePath != "" ? " " + command.filePath : "") + " " + command.args.join(" "));
  }

  if (options.stdout && options.stderr) {
    var cp = childProcess.spawn(command.executable, command.args, { stdio: "inherit" }),
      err = '';
    cp.stderr.on('data', function (data) {
      if (data) err += data;
    });
    cp.on('close', function (code) {
      if (err && err != "") {
        gutil.log(err);
        gutil.log(gutil.colors.red('Build failed!'));
        if (options.errorOnFail) {
          return callback(err);
        }
      } else {
        gutil.log(gutil.colors.cyan('Build complete!'));
      }
      return callback();
    });
  } else {
    var execOptions = { maxBuffer: options.maxBuffer };
    var cp = childProcess.exec(command.executable + (command.filePath != "" ? " " + command.filePath : "") + " " + command.args.join(" "), execOptions, function (err) {
      if (err) {
        gutil.log(err);
        gutil.log(gutil.colors.red('Build failed!'));
        if (options.errorOnFail) {
          return callback(err);
        }
      } else {
        gutil.log(gutil.colors.cyan('Build complete!'));
      }

      return callback();
    });

    if (options.stdout && cp) {
      cp.stdout.pipe(process.stdout);
    }

    if (options.stderr && cp) {
      cp.stderr.pipe(process.stderr);
    }
  }
};

