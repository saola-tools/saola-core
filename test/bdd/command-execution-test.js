'use strict';

var lab = require('../index');
var Devebot = lab.getDevebot();
var Promise = Devebot.require('bluebird');
var chores = Devebot.require('chores');
var lodash = Devebot.require('lodash');
var debugx = Devebot.require('pinbug')('bdd:devebot:command:execution');
var assert = require('chai').assert;
var DevebotApi = require('devebot-api');
var LogConfig = require('logolite').LogConfig;
var LogTracer = require('logolite').LogTracer;
var envmask = require('envmask').instance;

describe('bdd:devebot:command:execution', function() {
  this.timeout(lab.getDefaultTimeout());

  var app, api;
  var logStats = {};
  var logCounter = LogTracer.accumulationAppender.bind(null, logStats, [
    {
      matchingField: 'checkpoint',
      matchingRule: /plugin1-routine1-.*/g,
      countTo: 'plugin1Routine1Count'
    },
    {
      matchingField: 'checkpoint',
      matchingRule: /plugin1-routine2-.*/g,
      countTo: 'plugin1Routine2Count'
    }
  ]);
  var logScraper = LogTracer.accumulationAppender.bind(null, logStats, [
    {
      anyTags: [ 'logolite-metadata', 'devebot-metadata' ],
      storeTo: 'blockLoggingState'
    },
    {
      matchingField: 'checkpoint',
      matchingRule: 'plugin1-routine1-injected-names',
      selectedFields: ['injectedServiceNames', 'blockId', 'instanceId'],
      storeTo: 'plugin1Routine1State'
    },
    {
      matchingField: 'checkpoint',
      matchingRule: 'plugin1-routine2-injected-names',
      selectedFields: ['injectedServiceNames', 'blockId', 'instanceId'],
      storeTo: 'plugin1Routine2State'
    }
  ]);
  var injectedServiceNames = [];

  before(function() {
    envmask.setup({
      LOGOLITE_ALWAYS_ENABLED: 'all'
    });
    LogConfig.reset();
    LogTracer.reset();
    LogTracer.clearStringifyInterceptors();
    LogTracer.addStringifyInterceptor(logCounter);
    LogTracer.addStringifyInterceptor(logScraper);
    app = lab.getApp('default');
    injectedServiceNames = [
      chores.toFullname("application", "mainService"),
      chores.toFullname("plugin1", "plugin1Service"),
      chores.toFullname("plugin2", "plugin2Service")
    ];
    // run in bridge-full-ref mode, and apply presets config
    // don't care for standardizing-config feature
    if (chores.isUpgradeSupported(['bridge-full-ref','presets'])) {
      injectedServiceNames.push.apply(injectedServiceNames, [
        chores.toFullname("plugin1", "bridge1#anyname1a"),
        chores.toFullname("plugin2", "bridge1#anyname1b"),
        chores.toFullname("plugin2", "bridge1#anyname1c"),
        chores.toFullname("plugin1", "bridge2#anyname2a"),
        chores.toFullname("plugin2", "bridge2#anyname2b"),
        chores.toFullname("plugin1", "bridge2#anyname2c")
      ]);
    }
    if (!chores.isUpgradeSupported('bridge-full-ref')) {
      injectedServiceNames.push.apply(injectedServiceNames, [
        chores.toFullname("bridge1", "anyname1a"),
        chores.toFullname("bridge1", "anyname1b"),
        chores.toFullname("bridge1", "anyname1c"),
        chores.toFullname("bridge2", "anyname2a"),
        chores.toFullname("bridge2", "anyname2b"),
        chores.toFullname("bridge2", "anyname2c")
      ]);
    }
    api = new DevebotApi(lab.getApiConfig());
  });

  beforeEach(function(done) {
    LogTracer.reset().empty(logStats);
    app.server.start().asCallback(done);
  });

  it('definition should contain runhook-call command', function(done) {
    new Promise(function(resolved, rejected) {
      api.loadDefinition(function(err, obj) {
        if (err) return rejected(err);
        resolved(obj.payload);
      });
    }).then(function(defs) {
      var cmd = lodash.keyBy(defs.commands, 'name')['plugin1-routine1'];
      assert.isNotNull(cmd);
      done();
    });
  });

  it('remote runhook should return correct result', function(done) {
    new Promise(function(resolved, rejected) {
      api.on('failed', function(result) {
        rejected(result);
      });
      api.on('completed', function(result) {
        resolved(result);
      });
      api.execCommand({
        name: 'plugin1-routine1',
        options: {},
        data: { "key": "hello", "value": "world" }
      });
    }).then(function(result) {
      debugx.enabled && debugx(JSON.stringify(result, null, 2));
      assert.equal(logStats['plugin1Routine1Count'], 3);
      assert.isArray(logStats['plugin1Routine1State']);
      assert.equal(logStats['plugin1Routine1State'].length, 1);
      assert.sameMembers(logStats['plugin1Routine1State'][0]['injectedServiceNames'], injectedServiceNames);
      done();
    }).catch(function(error) {
      debugx.enabled && debugx(JSON.stringify(error, null, 2));
      done(error);
    });
  });

  it('direct runhook should return correct result', function(done) {
    new Promise(function(resolved, rejected) {
      api.on('failed', function(result) {
        rejected(result);
      });
      api.on('completed', function(result) {
        resolved(result);
      });
      api.execCommand({
        name: 'plugin1-routine2',
        data: { "key": "hello", "value": "world" }
      });
    }).then(function(result) {
      debugx.enabled && debugx(JSON.stringify(result, null, 2));
      assert.equal(logStats['plugin1Routine2Count'], 3);
      assert.isArray(logStats['plugin1Routine2State']);
      assert.equal(logStats['plugin1Routine2State'].length, 1);
      assert.sameMembers(logStats['plugin1Routine2State'][0]['injectedServiceNames'], injectedServiceNames);
      done();
    }).catch(function(error) {
      debugx.enabled && debugx(JSON.stringify(error, null, 2));
      done(error);
    });
  });

  afterEach(function(done) {
    app.server.stop().asCallback(done);
  });

  after(function() {
    LogTracer.clearStringifyInterceptors();
    envmask.reset();
  });
});
