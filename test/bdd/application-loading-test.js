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

describe('bdd:devebot:application', function() {
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
							allTags: [ chores.toFullname("devebot", "server"), 'start()' ],
							countTo: 'startingCount'
						},
						{
							allTags: [ chores.toFullname("devebot", "server"), 'close()' ],
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
				chores.toFullname("devebot", "bootstrap"),
				chores.toFullname("devebot", "appinfoLoader"),
				chores.toFullname("devebot", "nameResolver"),
				chores.toFullname("devebot", "configLoader"),
				chores.toFullname("devebot", "contextManager"),
				chores.toFullname("devebot", "kernel"),
				chores.toFullname("devebot", "server"),
				"devebot",
				chores.toFullname("devebot", "bridgeLoader"),
				chores.toFullname("devebot", "schemaValidator"),
				chores.toFullname("devebot", "pluginLoader"),
				chores.toFullname("devebot", "sandboxManager"),
				chores.toFullname("devebot", "jobqueueBinder"),
				chores.toFullname("devebot", "processManager"),
				chores.toFullname("devebot", "runhookManager"),
				chores.toFullname("devebot", "scriptExecutor"),
				chores.toFullname("devebot", "scriptRenderer"),
				chores.toFullname("devebot", "securityManager"),
				chores.toFullname("devebot", "repeatedTimer")
			];
			var plugin1Scopes = [
				chores.toFullname("plugin1", "plugin1Service"),
				chores.toFullname("plugin1", "plugin1Trigger")
			];
			var plugin2Scopes = [
				chores.toFullname("plugin2", "plugin2Service"),
				chores.toFullname("plugin2", "plugin2Trigger")
			];
			var mainScopes = [
				chores.toFullname("demo-app", "mainService"),
				chores.toFullname("demo-app", "mainTrigger")
			];

			var bridge1Scopes = [];
			var bridge2Scopes = [];

			if (chores.isUpgradeSupported(['bridge-full-ref','presets'])) {
				bridge1Scopes = [
					chores.toFullname("plugin1", "bridge1#anyname1a"),
					chores.toFullname("plugin2", "bridge1#anyname1b"),
					chores.toFullname("plugin2", "bridge1#anyname1c")
				];
				bridge2Scopes = [
					chores.toFullname("plugin1", "bridge2#anyname2a"),
					chores.toFullname("plugin2", "bridge2#anyname2b"),
					chores.toFullname("plugin1", "bridge2#anyname2c")
				];
			}

			if (!chores.isUpgradeSupported(['bridge-full-ref'])) {
				bridge1Scopes = [
					chores.toFullname("bridge1", "anyname1a"),
					chores.toFullname("bridge1", "anyname1b"),
					chores.toFullname("bridge1", "anyname1c")
				];
				bridge2Scopes = [
					chores.toFullname("bridge2", "anyname2a"),
					chores.toFullname("bridge2", "anyname2b"),
					chores.toFullname("bridge2", "anyname2c")
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
					false && assert.includeMembers(metadata, mainScopes);
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
							allTags: [ chores.toFullname('devebot', 'sandboxManager'), 'instantiateObject' ],
							storeTo: 'dependencyInfo'
						},
						{
							allTags: [ chores.toFullname('devebot-dp-wrapper1', 'sublibTrigger'), 'bridge-config' ],
							storeTo: 'bridgeConfigOfWrapper1'
						},
						{
							allTags: [ chores.toFullname('devebot-dp-wrapper2', 'sublibTrigger'), 'bridge-config' ],
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
			app = lab.getApp('naming-convention');
			app.server;

			false && console.log(JSON.stringify(moduleStats, null, 2));
			assert.isAbove(moduleStats.constructorBeginTotal, 0);
			assert.equal(moduleStats.constructorBeginTotal, moduleStats.constructorEndTotal);

			var expectedDependencies = [
				{
					"handlerName": chores.toFullname("application", "mainService"),
					"handlerType": "SERVICE"
				},
				{
					"handlerName": chores.toFullname("devebot-dp-wrapper1", "sublibService"),
					"handlerType": "SERVICE"
				},
				{
					"handlerName": chores.toFullname("devebot-dp-wrapper2", "sublibService"),
					"handlerType": "SERVICE"
				},
				{
					"handlerName": chores.toFullname("application", "mainTrigger"),
					"handlerType": "TRIGGER"
				},
				{
					"handlerName": chores.toFullname("devebot-dp-wrapper1", "sublibTrigger"),
					"handlerType": "TRIGGER"
				},
				{
					"handlerName": chores.toFullname("devebot-dp-wrapper2", "sublibTrigger"),
					"handlerType": "TRIGGER"
				}
			];
			if (chores.isUpgradeSupported('bridge-full-ref')) {
				expectedDependencies.push({
					"handlerName": chores.toFullname("application", "connector1#wrapper"),
					"handlerType": "DIALECT"
				},
				{
					"handlerName": chores.toFullname("devebot-dp-wrapper1", "connector1#bean"),
					"handlerType": "DIALECT"
				},
				{
					"handlerName": chores.toFullname("devebot-dp-wrapper2", "connector1#bean"),
					"handlerType": "DIALECT"
				},
				{
					"handlerName": chores.toFullname("application", "connector2#wrapper"),
					"handlerType": "DIALECT"
				},
				{
					"handlerName": chores.toFullname("devebot-dp-wrapper1", "connector2#bean"),
					"handlerType": "DIALECT"
				},
				{
					"handlerName": chores.toFullname("devebot-dp-wrapper2", "connector2#bean"),
					"handlerType": "DIALECT"
				},
				{
					"handlerName": chores.toFullname("devebot-dp-wrapper1", "bridgeKebabCase1#pointer"),
					"handlerType": "DIALECT"
				},
				{
					"handlerName": chores.toFullname("devebot-dp-wrapper2", "bridgeKebabCase1#pointer"),
					"handlerType": "DIALECT"
				},
				{
					"handlerName": chores.toFullname("devebot-dp-wrapper1", "bridgeKebabCase2#pointer"),
					"handlerType": "DIALECT"
				},
				{
					"handlerName": chores.toFullname("devebot-dp-wrapper2", "bridgeKebabCase2#pointer"),
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
			app = lab.getApp('naming-convention');
			app.runner.invoke(function(injektor) {
				var sandboxManager = injektor.lookup('sandboxManager');
				var service1 = sandboxManager.getSandboxService('sublibService', {
					scope: 'devebot-dp-wrapper1'
				});
				assert(service1.getConfig(), { port: 17741, host: 'localhost' });
				var service2 = sandboxManager.getSandboxService(chores.toFullname('devebot-dp-wrapper2', 'sublibService'));
				assert(service2.getConfig(), { port: 17742, host: 'localhost' });
				return done();
			});
		});

		it('[naming-convention] bridge configuration should be loaded properly', function() {
			if (!chores.isUpgradeSupported('bridge-full-ref')) {
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
			if (!chores.isUpgradeSupported('presets')) {
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
					"handlerName": chores.toFullname("application", "mainService"),
					"handlerType": "SERVICE"
				},
				{
					"handlerName": chores.toFullname("plugin-reference-alias", "sublibService"),
					"handlerType": "SERVICE"
				},
				{
					"handlerName": chores.toFullname("application", "mainTrigger"),
					"handlerType": "TRIGGER"
				},
				{
					"handlerName": chores.toFullname("plugin-reference-alias", "sublibTrigger"),
					"handlerType": "TRIGGER"
				}
			]);
		});

		it('[rename-comp-dir] special plugins & bridges should be loaded properly', function() {
			if (!chores.isUpgradeSupported('presets')) {
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
					"handlerName": chores.toFullname("application", "mainService"),
					"handlerType": "SERVICE"
				},
				{
					"handlerName": chores.toFullname("plugin-rename-comp-dir", "sublibService"),
					"handlerType": "SERVICE"
				},
				{
					"handlerName": chores.toFullname("application", "mainTrigger"),
					"handlerType": "TRIGGER"
				},
				{
					"handlerName": chores.toFullname("plugin-rename-comp-dir", "sublibTrigger"),
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
