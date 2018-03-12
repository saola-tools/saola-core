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
      LOGOLITE_ALWAYS_ENABLED: 'all',
      LOGOLITE_ALWAYS_MUTED: 'all'
    });
    LogConfig.reset();
  });

  describe('validate config/schemas', function() {
    var loggingStore = {};

    before(function() {
      LogTracer.setupDefaultInterceptors([{
        accumulator: loggingStore,
        mappings: [{
          allTags: [ 'devebot-kernel', 'loadSchemas' ],
          storeTo: 'schemaValidation'
        }, {
          allTags: [ 'devebot-kernel', 'config-schema-synchronizing' ],
          storeTo: 'schemaValidation'
        }, {
          allTags: [ 'devebot-kernel', 'config-schema-validating' ],
          storeTo: 'schemaValidation'
        }]
      }]);
    });

    beforeEach(function() {
      LogTracer.reset().empty(loggingStore);
    });

    it.skip('load all of schemas from kernel constructor', function() {
      var _bk_exit = process.exit;
      process.exit = console.log.bind(console);

      process.exit(1);

      process.exit = _bk_exit;
    });

    after(function() {
      LogTracer.clearStringifyInterceptors();
    });
  });

  after(function() {
		envtool.reset();
	});
});
