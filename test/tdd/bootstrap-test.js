'use strict';

var lab = require('../index');
var Devebot = lab.getDevebot();
var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');
var loader = Devebot.require('loader');
var debugx = Devebot.require('pinbug')('tdd:devebot:base:bootstrap');
var assert = require('chai').assert;
var expect = require('chai').expect;
var path = require('path');
var util = require('util');
var bootstrap = require('../../lib/bootstrap');
var LogConfig = require('logolite').LogConfig;
var LogTracer = require('logolite').LogTracer;
var envtool = require('logolite/envtool');

describe('tdd:devebot:base:bootstrap', function() {
  this.timeout(lab.getDefaultTimeout());

  before(function() {
    envtool.setup({
      LOGOLITE_ALWAYS_ENABLED: 'all',
      LOGOLITE_ALWAYS_MUTED: 'all'
		});
		LogConfig.reset();
  });

  describe('launchApplication()', function() {
    var assertAppConfig = function(app) {
      var cfg = app.config;
      false && console.log('SHOW [app.config]: ', cfg);
      assert.hasAllKeys(cfg, [
        'profile', 'sandbox', 'appName', 'appinfo', 'bridgeRefs', 'pluginRefs'
      ]);
      assert.equal(cfg.appName, 'devebot-application');
      assert.deepEqual(cfg.appinfo, {
        layerware: [],
        framework: lab.getFrameworkInfo()
      });
      assert.sameMembers(cfg.bridgeRefs, []);
      assert.sameDeepMembers(lodash.map(cfg.pluginRefs, item => {
        return lodash.pick(item, ['type', 'name'])
      }), [{
        type: 'application',
        name: 'devebot-application'
      },
      {
        type: 'framework',
        name: 'devebot'
      }]);
    }

    var assertAppRunner = function(app) {
      var runner = app.runner;
    }

    var assertAppServer = function(app) {
      var runner = app.runner;
    }

    beforeEach(function() {
      LogTracer.reset();
    });

    it('launch application with empty root directory (as string)', function() {
      var app = bootstrap.launchApplication(lab.getAppHome('empty'), [], []);
      assertAppConfig(app);
    });

    it('launch application with empty root directory (in context)', function() {
      var app = bootstrap.launchApplication({
        appRootPath: lab.getAppHome('empty')
      }, [], []);
      assertAppConfig(app);
      assertAppRunner(app);
      assertAppServer(app);
    });
  });

  after(function() {
		LogTracer.clearStringifyInterceptors();
		envtool.reset();
	});
});