'use strict';

var lab = require('../index');
var Devebot = lab.getDevebot();
var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');
var loader = Devebot.require('loader');
var debugx = Devebot.require('pinbug')('tdd:devebot:core:sandbox-manager');
var assert = require('chai').assert;
var path = require('path');
var util = require('util');
var LogConfig = require('logolite').LogConfig;
var LogTracer = require('logolite').LogTracer;
var envtool = require('logolite/envtool');
var errorHandlerPath = path.join(lab.getDevebotHome(), 'lib/backbone/error-handler');
var errorHandler = require(errorHandlerPath).instance;

describe('tdd:devebot:core:sandbox-manager', function() {
  this.timeout(lab.getDefaultTimeout());

  before(function() {
    envtool.setup({
      NODE_ENV: 'test',
      LOGOLITE_ALWAYS_ENABLED: 'all',
      LOGOLITE_ALWAYS_MUTED: 'all'
    });
    LogConfig.reset();
    errorHandler.reset();
  });

  it('retrieve the unique named service with/without suggested scope', function() {
    var sandboxManager = lab.createSandboxManager('fullapp');

    var plugin2Service0 = sandboxManager.getSandboxService('plugin2Service');
    assert.isNotNull(plugin2Service0);

    var plugin2Service1 = sandboxManager.getSandboxService('plugin2Service', {
      scope: 'plugin1'
    });
    assert.isNotNull(plugin2Service1);

    var plugin2Service2 = sandboxManager.getSandboxService('plugin2Service', {
      scope: 'plugin2'
    });
    assert.isNotNull(plugin2Service2);

    assert.equal(plugin2Service0, plugin2Service1);
    assert.equal(plugin2Service1, plugin2Service2);
  });

  it('retrieve the same named services from different plugins', function() {
    var sandboxManager = lab.createSandboxManager('fullapp');

    assert.throws(function() {
      var sublibService = sandboxManager.getSandboxService('sublibService');
    }, 'name [sublibService] is duplicated');

    var sublibService1 = sandboxManager.getSandboxService('sublibService', {
      scope: 'sub-plugin1'
    });
    false && console.log(sublibService1.getConfig());
    assert.isNotNull(sublibService1);
    assert.deepEqual(sublibService1.getConfig(), { host: 'localhost', port: 17721 });

    var sublibService2 = sandboxManager.getSandboxService('sublibService', {
      scope: 'sub-plugin2'
    });
    false && console.log(sublibService2.getConfig());
    assert.isNotNull(sublibService2);
    assert.deepEqual(sublibService2.getConfig(), { host: 'localhost', port: 17722 });
  });

  describe('definition', function() {
    var loggingStore = {};

    before(function() {
      LogTracer.setupDefaultInterceptors([{
        accumulator: loggingStore,
        mappings: [{
          allTags: [ 'devebot/sandboxManager', 'definition' ],
          storeTo: 'definition'
        }]
      }]);
    });

    beforeEach(function() {
      LogTracer.reset().empty(loggingStore);
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
