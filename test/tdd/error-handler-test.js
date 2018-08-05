'use strict';

var lab = require('../index');
var Devebot = lab.getDevebot();
var Promise = Devebot.require('bluebird');
var chores = Devebot.require('chores');
var lodash = Devebot.require('lodash');
var loader = Devebot.require('loader');
var debugx = Devebot.require('pinbug')('tdd:devebot:core:error-collector');
var assert = require('chai').assert;
var path = require('path');
var util = require('util');
var LogConfig = require('logolite').LogConfig;
var LogTracer = require('logolite').LogTracer;
var envtool = require('logolite/envtool');

describe('tdd:devebot:core:error-collector', function() {
  this.timeout(lab.getDefaultTimeout());

  var errorCollector = lab.getErrorCollector();

  before(function() {
    envtool.setup({
      NODE_ENV: 'test',
      LOGOLITE_ALWAYS_ENABLED: 'all',
      LOGOLITE_ALWAYS_MUTED: 'all',
      DEVEBOT_FORCING_SILENT: 'error-collector'
    });
    LogConfig.reset();
    errorCollector.reset();
  });

  describe('barrier()', function() {
    var loggingStore = {};

    before(function() {
      LogTracer.setupDefaultInterceptors([{
        accumulator: loggingStore,
        mappings: [{
          allTags: [ chores.toFullname('devebot', 'errorCollector'), 'examine' ],
          storeTo: 'errorSummary'
        }]
      }]);
    });

    beforeEach(function() {
      LogTracer.reset().empty(loggingStore);
    });

    it('pass if no error has occurred', function() {
      var unhook = lab.preventExit();
      errorCollector.collect();
      errorCollector.collect({
        hasError: false,
        stage: 'instantiating',
        type: 'ROUTINE'
      });
      errorCollector.collect([{
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
      errorCollector.barrier({exitOnError: true});
      var totalOfExit = unhook();
      assert.equal(totalOfExit, 0);
    });

    it('exit if there are some errors occurred', function() {
      var unhook = lab.preventExit({ throwException: true });

      function doSomething() {
        errorCollector.collect();

        errorCollector.collect({
          hasError: false,
          stage: 'bootstrap',
          type: 'plugin'
        });

        errorCollector.collect([{
          hasError: false,
          stage: 'naming',
          type: 'bridge'
        }, {
          hasError: false,
          stage: 'naming',
          type: 'plugin'
        }]);

        errorCollector.collect({
          hasError: true,
          stage: 'config/schema',
          type: 'bridge',
          name: 'bridge#example',
          stack: 'Error: {}'
        });

        errorCollector.barrier({exitOnError: true});
      }

      assert.throws(doSomething, lab.ProcessExitError);

      var totalOfExit = unhook();
      assert.equal(totalOfExit, 1);
    });

    afterEach(function() {
      errorCollector.reset();
    })

    after(function() {
      LogTracer.clearStringifyInterceptors();
    });
  });

  after(function() {
    envtool.reset();
  });
});
