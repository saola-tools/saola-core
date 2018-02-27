'use strict';

var lab = require('../index');
var Devebot = lab.getDevebot();
var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');
var debugx = Devebot.require('pinbug')('bdd:devebot:application-loading-test');
var assert = require('chai').assert;
var expect = require('chai').expect;
var LogConfig = require('logolite').LogConfig;
var LogTracer = require('logolite').LogTracer;
var envtool = require('logolite/envtool');

describe('devebot:application', function() {
	this.timeout(lab.getDefaultTimeout());

	var app;
	var logStats = {};

	before(function() {
		envtool.setup({
			LOGOLITE_ALWAYS_ENABLED: 'all'
		});
		LogConfig.reset();
		LogTracer.reset();
		LogTracer.setupDefaultInterceptors([
			{
				accumulator: logStats,
				mappings: [
					{
						anyTags: [ 'devebot-metadata' ],
						storeTo: 'metadata'
					},
					{
						anyTags: [ 'constructor-begin' ],
						countTo: 'constructorBeginTotal'
					},
					{
						anyTags: [ 'constructor-end' ],
						countTo: 'constructorEndTotal'
					}
				]
			}
		]);
	});

	beforeEach(function() {
		LogTracer.reset().empty(logStats);
	});

	it('total of constructor startpoints must equal to constructor endpoints', function(done) {
		app = lab.getApp();
		var devebotScopes = [
			"devebot/configLoader",
			"devebot/kernel",
			"devebot/server",
			"devebot",
			"devebot/bridgeLoader",
			"devebot/schemaValidator",
			"devebot/pluginLoader",
			"devebot/sandboxManager",
			"devebot/jobqueueBinder",
			"devebot/runhookManager",
			"devebot/scriptExecutor",
			"devebot/scriptRenderer",
			"devebot/securityManager",
			"devebot/repeatedTimer"
		];
		var plugin1Scopes = [];
		var plugin2Scopes = [
			"plugin2/plugin2Service",
			"plugin2/plugin2Trigger"
		];
		var bridge1Scopes = [];
		var bridge2Scopes = [
			"bridge2/anyname2a",
			"bridge2/anyname2b",
			"bridge2/anyname2c"
		];

		app.server.start()
			.then(function() {
				false && console.log(JSON.stringify(logStats, null, 2));
				assert.isAbove(logStats.constructorBeginTotal, 0);
				assert.equal(logStats.constructorBeginTotal, logStats.constructorEndTotal);
				var metadata = lodash.map(logStats.metadata, function(item) {
					return item && item.blockName
				});
				assert.includeMembers(metadata, devebotScopes);
				assert.includeMembers(metadata, plugin2Scopes);
				assert.includeMembers(metadata, bridge2Scopes);
				return true;
			})
			.then(function() {
				return app.server.teardown();
			})
			.then(function() {
				done();
			})
			.catch(function(err) {
				done(err);
			});
	});

	afterEach(function() {
		app = null;
	});

	after(function() {
		LogTracer.clearStringifyInterceptors();
		envtool.reset();
	});
});
