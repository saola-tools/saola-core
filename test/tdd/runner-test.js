'use strict';

var lab = require('../index');
var Devebot = lab.getDevebot();
var Promise = Devebot.require('bluebird');
var chores = Devebot.require('chores');
var lodash = Devebot.require('lodash');
var loader = Devebot.require('loader');
var debugx = Devebot.require('pinbug')('tdd:devebot:base:runner');
var assert = require('chai').assert;
var path = require('path');
var util = require('util');
var runner = require('../../lib/runner');
var LogConfig = require('logolite').LogConfig;
var LogTracer = require('logolite').LogTracer;
var envtool = require('logolite/envtool');
var rewire = require('rewire');
var sinon = require('sinon');

describe.skip('tdd:devebot:base:runner', function() {
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

  describe('validateBridgeConfig()', function() {
    var {loggingFactory, schemaValidator} = lab.createBasicServices('fullapp');
    var LX = loggingFactory.getLogger();
    var LT = loggingFactory.getTracer();

    after(function() {
      LogTracer.clearStringifyInterceptors();
      errorCollector.reset();
    });
  });

  after(function() {
    envtool.reset();
  });
});
