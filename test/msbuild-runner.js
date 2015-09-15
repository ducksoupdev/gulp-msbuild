/*global describe, it, beforeEach*/
'use strict';

var chai          = require('chai'),
    Stream        = require('stream'),
    childProcess  = require('child_process'),
    constants     = require('../lib/constants'),
    gutil         = require('gulp-util'),
    expect        = chai.expect;

chai.use(require('sinon-chai'));
require('mocha-sinon');

var commandBuilder = require('../lib/msbuild-command-builder');
var msbuildRunner = require('../lib/msbuild-runner');

var defaults;

var execCallbackArg;

describe('msbuild-runner with child process spawn', function () {

  beforeEach(function () {
    defaults = JSON.parse(JSON.stringify(constants.DEFAULTS));

    this.sinon.stub(childProcess, 'spawn', function (executable, args, options) {
      var close = function() {}, data = function() {};
      process.nextTick(function() { 
        data(execCallbackArg);
        close(execCallbackArg);
      });

      var stream = new Stream();
      stream.pipe = function() {};

      return {
        stdout: stream,
        stderr: {
          on: function(type, callback) {
            if (type === "data") {
              data = callback;
            }
          }
        },
        on: function(type, callback) {
          if (type === "close") {
            close = callback;
          }
        }
      };
    });

    this.sinon.stub(commandBuilder, 'construct').returns({ executable: 'msbuild', filePath: '', args: ['/nologo']});
    this.sinon.stub(gutil, 'log');
  });

  it('should execute the msbuild command', function (done) {
    defaults.logCommand = false;
    msbuildRunner.startMsBuildTask(defaults, {}, function () {
      expect(gutil.log).to.have.been.calledWith(gutil.colors.cyan('Build complete!'));
      done();
    });

    expect(childProcess.spawn).to.have.been.calledWith('msbuild', ['/nologo'], {stdio: "inherit"});
  });

  it('should log the command when the logCommand option is set', function(done) {
    defaults.logCommand = true;
    msbuildRunner.startMsBuildTask(defaults, {}, function () {
      expect(gutil.log).to.have.been.calledWith('Using msbuild command: msbuild /nologo');
      done();
    });
  });

  it('should log the error when the msbuild command failed', function (done) {
    execCallbackArg = 'test';

    msbuildRunner.startMsBuildTask(defaults, {}, function () {
      expect(gutil.log).to.have.been.calledWith(execCallbackArg);
      expect(gutil.log).to.have.been.calledWith(gutil.colors.red('Build failed!'));
      done();
    });
  });

  it('should log the error and return the error in the callback when the msbuild command failed', function (done) {
    defaults.errorOnFail = true;
    execCallbackArg = 'test';

    msbuildRunner.startMsBuildTask(defaults, {}, function (err) {
      expect(err).to.be.equal(execCallbackArg);
      expect(gutil.log).to.have.been.calledWith(execCallbackArg);
      expect(gutil.log).to.have.been.calledWith(gutil.colors.red('Build failed!'));
      done();
    });
  });
});

describe('msbuild-runner with child process exec', function () {

  beforeEach(function () {
    defaults = JSON.parse(JSON.stringify(constants.DEFAULTS));
    defaults.stdout = false;
    execCallbackArg = undefined;

    this.sinon.stub(childProcess, 'exec', function (command, options, callback) {
      process.nextTick(function() { callback(execCallbackArg); });

      var stream = new Stream();
      stream.pipe = function() {};

      return {
        stdout: stream,
        stderr: stream
      };
    });
    
    this.sinon.stub(commandBuilder, 'construct').returns({ executable: 'msbuild', filePath: '', args: ['/nologo']});
    this.sinon.stub(gutil, 'log');
  });

  it('should execute the msbuild command', function (done) {
    msbuildRunner.startMsBuildTask(defaults, {}, function () {
      expect(gutil.log).to.have.been.calledWith(gutil.colors.cyan('Build complete!'));
      done();
    });

    expect(childProcess.exec).to.have.been.calledWith('msbuild /nologo', { maxBuffer: defaults.maxBuffer });
  });

  it('should log the command when the logCommand option is set', function(done) {
    defaults.logCommand = true;
    msbuildRunner.startMsBuildTask(defaults, {}, function () {
      expect(gutil.log).to.have.been.calledWith('Using msbuild command: msbuild /nologo');
      done();
    });
  });

  it('should log the error when the msbuild command failed', function (done) {
    execCallbackArg = 'test';

    msbuildRunner.startMsBuildTask(defaults, {}, function () {
      expect(gutil.log).to.have.been.calledWith(execCallbackArg);
      expect(gutil.log).to.have.been.calledWith(gutil.colors.red('Build failed!'));
      done();
    });
  });

  it('should log the error and return the error in the callback when the msbuild command failed', function (done) {
    defaults.errorOnFail = true;
    execCallbackArg = 'test';

    msbuildRunner.startMsBuildTask(defaults, {}, function (err) {
      expect(err).to.be.equal(execCallbackArg);
      expect(gutil.log).to.have.been.calledWith(execCallbackArg);
      expect(gutil.log).to.have.been.calledWith(gutil.colors.red('Build failed!'));
      done();
    });
  });
});