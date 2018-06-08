'use strict';

var lab = require('../index');
var Devebot = lab.getDevebot();
var Promise = Devebot.require('bluebird');
var chores = Devebot.require('chores');
var lodash = Devebot.require('lodash');
var debugx = Devebot.require('pinbug')('bdd:devebot:application-loading-test');
var assert = require('chai').assert;
var expect = require('chai').expect;
var LogConfig = require('logolite').LogConfig;
var LogTracer = require('logolite').LogTracer;
var envtool = require('logolite/envtool');
var util = require('util');

describe('devebot:application', function() {
	this.timeout(lab.getDefaultTimeout());

	before(function() {
		envtool.setup({
			LOGOLITE_ALWAYS_ENABLED: 'all'
		});
		LogConfig.reset();
	});

	describe('application[default]', function() {
		var app;
		var serverStats = {};
		var moduleStats = {};

		before(function() {
			LogTracer.setupDefaultInterceptors([
				{
					accumulator: serverStats,
					mappings: [
						{
							allTags: [ 'devebot/server', 'start()' ],
							countTo: 'startingCount'
						},
						{
							allTags: [ 'devebot/server', 'close()' ],
							countTo: 'stoppingCount'
						}
					]
				},
				{
					accumulator: moduleStats,
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
			LogTracer.reset().empty(serverStats).empty(moduleStats);
		});

		it('total of constructor startpoints must equal to constructor endpoints', function(done) {
			app = lab.getApp();
			var devebotScopes = [
				"devebot/bootstrap",
				"devebot/appinfoLoader",
				"devebot/nameResolver",
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
			var plugin1Scopes = [
				"plugin1/plugin1Service",
				"plugin1/plugin1Trigger"
			];
			var plugin2Scopes = [
				"plugin2/plugin2Service",
				"plugin2/plugin2Trigger"
			];

			var bridge1Scopes = [];
			var bridge2Scopes = [];

			if (chores.isFeatureSupported(['bridge-full-ref','presets'])) {
				bridge1Scopes = [
					"plugin1/bridge1#anyname1a",
					"plugin2/bridge1#anyname1b",
					"plugin2/bridge1#anyname1c"
				];
				bridge2Scopes = [
					"plugin1/bridge2#anyname2a",
					"plugin2/bridge2#anyname2b",
					"plugin1/bridge2#anyname2c"
				];
			}

			if (!chores.isFeatureSupported(['bridge-full-ref'])) {
				bridge1Scopes = [
					"bridge1/anyname1a",
					"bridge1/anyname1b",
					"bridge1/anyname1c"
				];
				bridge2Scopes = [
					"bridge2/anyname2a",
					"bridge2/anyname2b",
					"bridge2/anyname2c"
				];
			}

			app.server.start()
				.then(function(info) {
					assert.equal(serverStats.startingCount, 3);
					return info;
				})
				.delay(100)
				.then(function(info) {
					false && console.log(JSON.stringify(moduleStats, null, 2));
					assert.isAbove(moduleStats.constructorBeginTotal, 0);
					assert.equal(moduleStats.constructorBeginTotal, moduleStats.constructorEndTotal);
					var metadata = lodash.map(moduleStats.metadata, function(item) {
						return item && item.blockName
					});
					false && console.log(JSON.stringify(metadata, null, 2));
					assert.includeMembers(metadata, devebotScopes);
					assert.includeMembers(metadata, plugin1Scopes);
					assert.includeMembers(metadata, plugin2Scopes);
					assert.includeMembers(metadata, bridge1Scopes);
					assert.includeMembers(metadata, bridge2Scopes);
					assert.equal(metadata.length, devebotScopes.length +
							plugin1Scopes.length + plugin2Scopes.length +
							bridge1Scopes.length + bridge2Scopes.length);
					return info;
				})
				.delay(100)
				.then(function(info) {
					return app.server.stop();
				})
				.then(function() {
					assert.equal(serverStats.stoppingCount, 3);
					done();
				})
				.catch(done);
		});

		afterEach(function() {
			app = null;
		});

		after(function() {
			LogTracer.clearStringifyInterceptors();
		});
	});

	describe('other applications', function() {
		var app;
		var moduleStats = {};

		before(function() {
			LogTracer.setupDefaultInterceptors([
				{
					accumulator: moduleStats,
					mappings: [
						{
							allTags: [ 'devebot/sandboxManager', 'instantiateObject' ],
							storeTo: 'dependencyInfo'
						},
						{
							allTags: [ 'devebot-dp-wrapper1/sublibTrigger', 'bridge-config' ],
							storeTo: 'bridgeConfigOfWrapper1'
						},
						{
							allTags: [ 'devebot-dp-wrapper2/sublibTrigger', 'bridge-config' ],
							storeTo: 'bridgeConfigOfWrapper2'
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
			LogTracer.reset().empty(moduleStats);
		});

		it('[naming-convention] special plugins & bridges should be loaded properly', function() {
			if (!chores.isFeatureSupported('presets')) {
				this.skip();
				return;
			}

			app = lab.getApp('naming-convention');
			app.server;

			false && console.log(JSON.stringify(moduleStats, null, 2));
			assert.isAbove(moduleStats.constructorBeginTotal, 0);
			assert.equal(moduleStats.constructorBeginTotal, moduleStats.constructorEndTotal);

			var expectedDependencies = [
				{
					"handlerName": "application/mainService",
					"handlerType": "SERVICE"
				},
				{
					"handlerName": "devebot-dp-wrapper1/sublibService",
					"handlerType": "SERVICE"
				},
				{
					"handlerName": "devebot-dp-wrapper2/sublibService",
					"handlerType": "SERVICE"
				},
				{
					"handlerName": "application/mainTrigger",
					"handlerType": "TRIGGER"
				},
				{
					"handlerName": "devebot-dp-wrapper1/sublibTrigger",
					"handlerType": "TRIGGER"
				},
				{
					"handlerName": "devebot-dp-wrapper2/sublibTrigger",
					"handlerType": "TRIGGER"
				}
			];
			if (chores.isFeatureSupported('bridge-full-ref')) {
				expectedDependencies.push({
					"handlerName": "application/connector1#wrapper",
					"handlerType": "DIALECT"
				},
				{
					"handlerName": "devebot-dp-wrapper1/connector1#bean",
					"handlerType": "DIALECT"
				},
				{
					"handlerName": "devebot-dp-wrapper2/connector1#bean",
					"handlerType": "DIALECT"
				},
				{
					"handlerName": "application/connector2#wrapper",
					"handlerType": "DIALECT"
				},
				{
					"handlerName": "devebot-dp-wrapper1/connector2#bean",
					"handlerType": "DIALECT"
				},
				{
					"handlerName": "devebot-dp-wrapper2/connector2#bean",
					"handlerType": "DIALECT"
				},
				{
					"handlerName": "devebot-dp-wrapper1/bridgeKebabCase1#pointer",
					"handlerType": "DIALECT"
				},
				{
					"handlerName": "devebot-dp-wrapper2/bridgeKebabCase1#pointer",
					"handlerType": "DIALECT"
				},
				{
					"handlerName": "devebot-dp-wrapper1/bridgeKebabCase2#pointer",
					"handlerType": "DIALECT"
				},
				{
					"handlerName": "devebot-dp-wrapper2/bridgeKebabCase2#pointer",
					"handlerType": "DIALECT"
				});
			};

			var dependencyInfo = lodash.map(moduleStats.dependencyInfo, function(item) {
				return lodash.pick(item, ['handlerName', 'handlerType']);
			});
			false && console.log(JSON.stringify(dependencyInfo, null, 2));
			assert.sameDeepMembers(dependencyInfo, expectedDependencies);
		});

		it('[naming-convention] special plugins & bridges should be available', function(done) {
			if (!chores.isFeatureSupported('presets')) {
				this.skip();
				return done();
			}

			app = lab.getApp('naming-convention');
			app.runner.invoke(function(injektor) {
				var sandboxManager = injektor.lookup('sandboxManager');
				var service1 = sandboxManager.getSandboxService('sublibService', {
					scope: 'devebot-dp-wrapper1'
				});
				assert(service1.getConfig(), { port: 17741, host: 'localhost' });
				var service2 = sandboxManager.getSandboxService('devebot-dp-wrapper2/sublibService');
				assert(service2.getConfig(), { port: 17742, host: 'localhost' });
				return done();
			});
		});

		it('[naming-convention] bridge configuration should be loaded properly', function() {
			if (!chores.isFeatureSupported('presets')) {
				this.skip();
				return done();
			}

			app = lab.getApp(lab.unloadApp('naming-convention'));
			app.server;

			for(var k=1; k<=2; k++) {
				var config = lodash.map(moduleStats['bridgeConfigOfWrapper' + k], function(item) {
					return lodash.get(item, 'config');
				});
				false && console.log(JSON.stringify(config, null, 2));
				assert.sameDeepMembers(config, [
					{
						"default": false,
						"refPath": util.format("sandbox -> connector1 -> wrapper%s -> bean", k),
						"refType": util.format("wrapper%s", k),
						"refName": util.format("devebot-dp-wrapper%s", k)
					},
					{
						"default": false,
						"refPath": util.format("sandbox -> connector2 -> wrapper%s -> bean", k),
						"refType": util.format("wrapper%s", k),
						"refName": util.format("devebot-dp-wrapper%s", k)
					}
				]);
			}
		});

		it('[reference-alias] special plugins & bridges should be loaded properly', function() {
			if (!chores.isFeatureSupported('presets')) {
				this.skip();
				return;
			}

			app = lab.getApp('reference-alias');
			app.server;

			false && console.log(JSON.stringify(moduleStats, null, 2));
			assert.isAbove(moduleStats.constructorBeginTotal, 0);
			assert.equal(moduleStats.constructorBeginTotal, moduleStats.constructorEndTotal);

			var dependencyInfo = lodash.map(moduleStats.dependencyInfo, function(item) {
				return lodash.pick(item, ['handlerName', 'handlerType']);
			});
			false && console.log(JSON.stringify(dependencyInfo, null, 2));
			assert.sameDeepMembers(dependencyInfo, [
				{
					"handlerName": "application/mainService",
					"handlerType": "SERVICE"
				},
				{
					"handlerName": "plugin-reference-alias/sublibService",
					"handlerType": "SERVICE"
				},
				{
					"handlerName": "application/mainTrigger",
					"handlerType": "TRIGGER"
				},
				{
					"handlerName": "plugin-reference-alias/sublibTrigger",
					"handlerType": "TRIGGER"
				}
			]);
		});

		it('[rename-comp-dir] special plugins & bridges should be loaded properly', function() {
			if (!chores.isFeatureSupported('presets')) {
				this.skip();
				return;
			}

			app = lab.getApp('rename-comp-dir');
			app.server;

			false && console.log(JSON.stringify(moduleStats, null, 2));
			assert.isAbove(moduleStats.constructorBeginTotal, 0);
			assert.equal(moduleStats.constructorBeginTotal, moduleStats.constructorEndTotal);

			var dependencyInfo = lodash.map(moduleStats.dependencyInfo, function(item) {
				return lodash.pick(item, ['handlerName', 'handlerType']);
			});
			false && console.log(JSON.stringify(dependencyInfo, null, 2));
			assert.sameDeepMembers(dependencyInfo, [
				{
					"handlerName": "application/mainService",
					"handlerType": "SERVICE"
				},
				{
					"handlerName": "plugin-rename-comp-dir/sublibService",
					"handlerType": "SERVICE"
				},
				{
					"handlerName": "application/mainTrigger",
					"handlerType": "TRIGGER"
				},
				{
					"handlerName": "plugin-rename-comp-dir/sublibTrigger",
					"handlerType": "TRIGGER"
				}
			]);
		});

		after(function() {
			LogTracer.clearStringifyInterceptors();
		});
	});

	after(function() {
		envtool.reset();
	});
});
