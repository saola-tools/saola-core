'use strict';

var lab = require('../index');
var Devebot = lab.getDevebot();
var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');
var loader = Devebot.require('loader');
var assert = require('chai').assert;
var path = require('path');
var util = require('util');
var LogConfig = require('logolite').LogConfig;
var LogTracer = require('logolite').LogTracer;
var envtool = require('logolite/envtool');

var debugx = Devebot.require('pinbug')('tdd:devebot:core:context-manager');

describe('tdd:devebot:core:context-manager', function() {
  this.timeout(lab.getDefaultTimeout());

  var errorCollector = lab.getErrorCollector();

  before(function() {
    envtool.setup({
      NODE_ENV: 'test',
      LOGOLITE_ALWAYS_ENABLED: 'all',
      LOGOLITE_ALWAYS_MUTED: 'all'
    });
    errorCollector.reset();
    LogConfig.reset();
  });

  it("isFeatureSupported() return true with provided features", function() {
    var localEnv = envtool.new({
      STATE_VERIFICATION_FEATURE_ENABLED: '123, abc'
    });
    var contextManager = lab.getContextManager('state-verification');
    assert.isTrue(contextManager.isFeatureSupported('abc'));
    assert.isTrue(contextManager.isFeatureSupported(['123', 'abc']));
    localEnv.reset();
  });

  after(function() {
    envtool.reset();
    errorCollector.reset();
  });
});
