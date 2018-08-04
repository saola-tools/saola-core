'use strict';

var lab = require('../index');
var Devebot = lab.getDevebot();
var Promise = Devebot.require('bluebird');
var Injektor = Devebot.require('injektor');
var lodash = Devebot.require('lodash');
var loader = Devebot.require('loader');
var debugx = Devebot.require('pinbug')('tdd:devebot:core:sandbox-manager');
var assert = require('chai').assert;
var path = require('path');
var util = require('util');
var LogConfig = require('logolite').LogConfig;
var LogTracer = require('logolite').LogTracer;
var envtool = require('logolite/envtool');

describe('tdd:devebot:core:sandbox-manager', function() {
  this.timeout(lab.getDefaultTimeout());

  var errorCollector = lab.getErrorCollector();

  before(function() {
    envtool.setup({
      NODE_ENV: 'test',
      LOGOLITE_ALWAYS_ENABLED: 'all',
      LOGOLITE_ALWAYS_MUTED: 'all'
    });
    LogConfig.reset();
    errorCollector.reset();
  });

  it('getBridgeDialectNames() - retrieve bridge dialect names correctly', function() {
    var sandboxManager = lab.createSandboxManager('fullapp');
    assert.deepEqual(sandboxManager.getBridgeDialectNames(), [
      'application/bridge1#anyname1z',
      'plugin1/bridge1#anyname1a',
      'plugin2/bridge1#anyname1b',
      'plugin2/bridge1#anyname1c',
      'application/bridge2#anyname2y',
      'application/bridge2#anyname2z',
      'plugin1/bridge2#anyname2a',
      'plugin1/bridge2#anyname2c',
      'plugin2/bridge2#anyname2b',
      'application/connector1#wrapper',
      'application/connector2#wrapper'
    ]);
  });

  it('getPluginServiceNames() - retrieve plugin service names correctly', function() {
    var sandboxManager = lab.createSandboxManager('fullapp');
    assert.deepEqual(sandboxManager.getPluginServiceNames(), [
      'application/mainService',
      'sub-plugin1/sublibService',
      'sub-plugin2/sublibService',
      'plugin1/plugin1Service',
      'plugin2/plugin2Service',
      'plugin3/plugin3Service'
    ]);
  });

  it('getPluginTriggerNames() - retrieve plugin trigger names correctly', function() {
    var sandboxManager = lab.createSandboxManager('fullapp');
    assert.deepEqual(sandboxManager.getPluginTriggerNames(), [
      'application/mainTrigger',
      'sub-plugin1/sublibTrigger',
      'sub-plugin2/sublibTrigger',
      'plugin1/plugin1Trigger',
      'plugin2/plugin2Trigger',
      'plugin3/plugin3Trigger'
    ]);
  });

  it('getSandboxService() - retrieve the unique named service with/without suggested scope', function() {
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

  it('getSandboxService() - retrieve the same named services from different plugins', function() {
    var sandboxManager = lab.createSandboxManager('fullapp');

    assert.throws(function() {
      var sublibService = sandboxManager.getSandboxService('sublibService');
    }, Injektor.errors.DuplicatedRelativeNameError, 'name [sublibService] is duplicated');

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

  describe('logging-interception', function() {
    var loggingStore = {};

    before(function() {
      LogTracer.setupDefaultInterceptors([{
        accumulator: loggingStore,
        mappings: [{
          allTags: [ 'devebot/sandboxManager', 'excluded-internal-services' ],
          storeTo: 'list'
        }]
      }]);
    });

    beforeEach(function() {
      LogTracer.reset().empty(loggingStore);
    });

    it('excludedServices should be defined properly', function() {
      var sandboxManager = lab.createSandboxManager('fullapp');
      var excluded = lodash.get(loggingStore, 'list.0.excludedServices', {});
      if (true) {
        assert.deepEqual(excluded, [
          "devebot/sandboxRegistry"
        ]);
      } else {
        console.log(JSON.stringify(excluded, null, 2));
      }
    });

    after(function() {
      LogTracer.clearStringifyInterceptors();
    });
  });

  after(function() {
    envtool.reset();
    errorCollector.reset();
  });
});
