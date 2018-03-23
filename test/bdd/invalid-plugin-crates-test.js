'use strict';

var lab = require('../index');
var Devebot = lab.getDevebot();
var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');
var debugx = Devebot.require('pinbug')('bdd:devebot:loading-invalid-crates');
var assert = require('chai').assert;
var expect = require('chai').expect;
var util = require('util');
var path = require('path');
var LogConfig = require('logolite').LogConfig;
var LogTracer = require('logolite').LogTracer;
var envtool = require('logolite/envtool');
var errorHandlerPath = path.join(lab.getDevebotHome(), 'lib/backbone/error-handler');
var errorHandler = require(errorHandlerPath).instance;

describe('bdd:devebot:loading-invalid-crates', function() {
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

  describe('invalid-plugin-crates', function() {
    var loggingStore = {};

    before(function() {
      LogTracer.setupDefaultInterceptors([{
        accumulator: loggingStore,
        mappings: [{
          allTags: [ 'devebot/errorHandler', 'examine' ],
          matchingField: 'invoker',
          matchingRule: 'devebot/sandboxManager',
          storeTo: 'errorSummary'
        }]
      }]);
    });

    beforeEach(function() {
      LogTracer.reset().empty(loggingStore);
      errorHandler.reset();
    });

    it('loading invalid-plugin-service will be failed', function() {
      var unhook = lab.preventExit();
      var app = lab.getApp('invalid-plugin-service');
      app.server;

      false && console.log('errorSummary: %s', JSON.stringify(loggingStore.errorSummary, null, 2));
      assert.lengthOf(lodash.get(loggingStore, 'errorSummary', []), 1);
      var errorSummary = lodash.pick(lodash.get(loggingStore, 'errorSummary.0', {}), [
        'totalOfErrors', 'errors'
      ]);
      assert.equal(errorSummary.totalOfErrors, 1);

      var totalOfExit = unhook();
      assert.equal(totalOfExit, 1);
    });

    it('loading invalid-plugin-trigger will be failed', function() {
      var unhook = lab.preventExit();
      var app = lab.getApp('invalid-plugin-trigger');
      app.server;

      false && console.log('errorSummary: %s', JSON.stringify(loggingStore.errorSummary, null, 2));
      assert.lengthOf(lodash.get(loggingStore, 'errorSummary', []), 1);
      var errorSummary = lodash.pick(lodash.get(loggingStore, 'errorSummary.0', {}), [
        'totalOfErrors', 'errors'
      ]);
      assert.equal(errorSummary.totalOfErrors, 1);

      var totalOfExit = unhook();
      assert.equal(totalOfExit, 1);
    });

    after(function() {
      LogTracer.clearStringifyInterceptors();
    });
  });

  after(function() {
    envtool.reset();
    errorHandler.reset();
  });
});
