'use strict';

var lab = require('../index');
var Devebot = lab.getDevebot();
var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');
var assert = require('chai').assert;
var LogConfig = require('logolite').LogConfig;
var LogTracer = require('logolite').LogTracer;
var EnvMask = require('envmask');
var envmask = EnvMask.instance;
var envbox = require(lab.getDevebotModule('utils/envbox'));
var debugx = Devebot.require('pinbug')('tdd:devebot:core:context-manager');

describe('tdd:devebot:core:context-manager', function() {
  this.timeout(lab.getDefaultTimeout());

  var issueInspector = lab.getIssueInspector();

  before(function() {
    envmask.setup({
      NODE_ENV: 'test',
      LOGOLITE_ALWAYS_ENABLED: 'all',
      LOGOLITE_ALWAYS_MUTED: 'all'
    });
    issueInspector.reset();
    LogConfig.reset();
  });

  beforeEach(function() {
    envbox.clearCache();
  });

  it("isFeatureSupported() return true with provided features", function() {
    var localEnv = new EnvMask({
      STATE_VERIFICATION_FEATURE_ENABLED: '123, abc'
    });
    var contextManager = lab.getContextManager('state-verification').clearCache();
    assert.isFalse(contextManager.isFeatureSupported('unknown'));
    assert.isTrue(contextManager.isFeatureSupported('abc'));
    assert.isTrue(contextManager.isFeatureSupported(['123', 'abc']));
    assert.isTrue(contextManager.isFeatureSupported(['def']));
    assert.isTrue(contextManager.isFeatureSupported(['def', 'abc']));
    localEnv.reset();
  });

  it("FEATURE_DISABLED has a higher priority than FEATURE_ENABLED", function() {
    var localEnv = new EnvMask({
      STATE_VERIFICATION_FEATURE_DISABLED: 'abc, def',
      STATE_VERIFICATION_FEATURE_ENABLED: '123, abc'
    });
    var contextManager = lab.getContextManager('state-verification').clearCache();
    assert.isFalse(contextManager.isFeatureSupported('abc'));
    assert.isFalse(contextManager.isFeatureSupported(['123', 'def']));
    localEnv.reset();
  });

  after(function() {
    envmask.reset();
    issueInspector.reset();
  });
});
