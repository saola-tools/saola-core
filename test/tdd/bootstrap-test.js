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

describe('devebot:base:bootstrap', function() {
  this.timeout(lab.getDefaultTimeout());

  before(function() {
    envtool.setup({
      LOGOLITE_ALWAYS_ENABLED: 'all',
      LOGOLITE_ALWAYS_MUTED: 'all'
		});
		LogConfig.reset();
  });

  describe('launchApplication()', function() {
    var assertAppObject = function(app) {
      assert.isNotNull(app.config);
      assert.isNotNull(app.runner);
      assert.isNotNull(app.server);
    }

    beforeEach(function() {
      LogTracer.reset();
    });

    it('launch application with empty root directory (as string)', function() {
      var app = bootstrap.launchApplication(lab.getAppHome('empty'), [], []);
      assertAppObject(app);
    });

    it('launch application with empty root directory (in context)', function() {
      var app = bootstrap.launchApplication({
        appRootPath: lab.getAppHome('empty')
      }, [], []);
      assertAppObject(app);
    });
  });

  after(function() {
		LogTracer.clearStringifyInterceptors();
		envtool.reset();
	});
});