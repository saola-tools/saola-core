'use strict';

var lab = require('../index');
var Devebot = lab.getDevebot();
var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');
var loader = Devebot.require('loader');
var debugx = Devebot.require('pinbug')('tdd:devebot:base:kernel');
var assert = require('chai').assert;
var path = require('path');
var util = require('util');
var kernel = require('../../lib/kernel');
var LogConfig = require('logolite').LogConfig;
var LogTracer = require('logolite').LogTracer;
var envtool = require('logolite/envtool');
var rewire = require('rewire');
var errorHandlerPath = path.join(lab.getDevebotHome(), 'lib/backbone/error-handler');
var errorHandler = require(errorHandlerPath).instance;

describe('tdd:devebot:base:kernel', function() {
  this.timeout(lab.getDefaultTimeout());

  before(function() {
    envtool.setup({
      LOGOLITE_ALWAYS_ENABLED: 'all',
      LOGOLITE_ALWAYS_MUTED: 'all'
    });
    LogConfig.reset();
  });

  describe.only('validate config/schemas', function() {
    var loggingStore = {};

    before(function() {
      LogTracer.setupDefaultInterceptors([{
        accumulator: loggingStore,
        mappings: [{
          allTags: [ 'devebot-kernel', 'loadSchemas' ],
          storeTo: 'schemaCollection'
        }]
      }]);
    });

    beforeEach(function() {
      LogTracer.reset().empty(loggingStore);
    });

    it('load all of schemas from kernel constructor', function() {
      var kernel = lab.createKernel('fullapp');
      var configMap = lodash.get(loggingStore, 'schemaCollection.0.configMap', {});
      var schemaMap = lodash.get(loggingStore, 'schemaCollection.0.schemaMap', {});
      false && console.log('Config: %s', JSON.stringify(configMap, null, 2));
      false && console.log('Schema: %s', JSON.stringify(schemaMap, null, 2));
    });

    after(function() {
      LogTracer.clearStringifyInterceptors();
    });
  });

  after(function() {
		envtool.reset();
	});
});
