'use strict';

var lab = require('../index');
var Devebot = lab.getDevebot();
var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');
var loader = Devebot.require('loader');
var debugx = Devebot.require('pinbug')('tdd:devebot:core:error-handler');
var assert = require('chai').assert;
var path = require('path');
var util = require('util');
var LogConfig = require('logolite').LogConfig;
var LogTracer = require('logolite').LogTracer;
var envtool = require('logolite/envtool');
var errorHandlerPath = path.join(lab.getDevebotHome(), 'lib/backbone/error-handler');
var errorHandler = require(errorHandlerPath).instance;

describe('tdd:devebot:core:error-handler', function() {
  this.timeout(lab.getDefaultTimeout());

  before(function() {
    envtool.setup({
      NODE_ENV: 'test',
      LOGOLITE_ALWAYS_ENABLED: 'all',
      LOGOLITE_ALWAYS_MUTED: 'all',
      DEVEBOT_FORCING_SILENT: 'error-handler'
    });
    LogConfig.reset();
    errorHandler.reset();
  });

  describe('barrier()', function() {
    var loggingStore = {};

    before(function() {
      LogTracer.setupDefaultInterceptors([{
        accumulator: loggingStore,
        mappings: [{
          allTags: [ 'devebot/errorHandler', 'examine' ],
          storeTo: 'errorSummary'
        }]
      }]);
    });

    beforeEach(function() {
      LogTracer.reset().empty(loggingStore);
    });

    it('pass if no error has occurred', function() {
      var unhook = lab.preventExit();
      errorHandler.collect();
      errorHandler.collect({
        hasError: false,
        stage: 'instantiating',
        type: 'ROUTINE'
      });
      errorHandler.collect([{
        hasError: false,
        stage: 'instantiating',
        type: 'ROUTINE'
      }, {
        hasError: false,
        stage: 'instantiating',
        type: 'SERVICE'
      }, {
        hasError: false,
        stage: 'instantiating',
        type: 'TRIGGER'
      }]);
      errorHandler.barrier({exitOnError: true});
      var totalOfExit = unhook();
      assert.equal(totalOfExit, 0);
    });

    it('exit if there are some errors occurred', function() {
      var unhook = lab.preventExit({ throwException: true });

      function doSomething() {
        errorHandler.collect();

        errorHandler.collect({
          hasError: false,
          stage: 'bootstrap',
          type: 'plugin'
        });

        errorHandler.collect([{
          hasError: false,
          stage: 'naming',
          type: 'bridge'
        }, {
          hasError: false,
          stage: 'naming',
          type: 'plugin'
        }]);

        errorHandler.collect({
          hasError: true,
          stage: 'config/schema',
          type: 'bridge',
          name: 'bridge#example',
          stack: 'Error: {}'
        });

        errorHandler.barrier({exitOnError: true});
      }

      assert.throws(doSomething, lab.ProcessExitError);

      var totalOfExit = unhook();
      assert.equal(totalOfExit, 1);
    });

    afterEach(function() {
      errorHandler.reset();
    })

    after(function() {
      LogTracer.clearStringifyInterceptors();
    });
  });

  after(function() {
    envtool.reset();
  });
});
