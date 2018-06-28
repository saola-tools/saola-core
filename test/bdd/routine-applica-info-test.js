'use strict';

var lab = require('../index');
var Devebot = lab.getDevebot();
var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');
var debugx = Devebot.require('pinbug')('bdd:devebot:command:applica-info');
var assert = require('chai').assert;
var expect = require('chai').expect;
var util = require('util');
var DevebotApi = require('devebot-api');

describe('bdd:devebot:command:applica-info', function() {
	this.timeout(lab.getDefaultTimeout());

	describe('app.runner', function() {
		var app, api;

		before(function() {
			app = lab.getApp();
		});

		beforeEach(function() {
			api = new DevebotApi(lab.getApiConfig({
				ws: app.runner.listen()
			}));
		});

		it('definition should contain [applica-info] command', function(done) {
			new Promise(function(resolved, rejected) {
				api.loadDefinition(function(err, obj) {
					if (err) return rejected(err);
					resolved(obj.payload);
				});
			}).then(function(defs) {
				var cmd = lodash.keyBy(defs.commands, 'name')['applica-info'];
				false && console.log(cmd);
				assert.isNotNull(cmd);
				assert.deepEqual(cmd, {
					package: 'devebot',
					name: 'applica-info',
					alias: 'app-info',
					description: 'Display application information',
					options: []
				});
				done();
			});
		});

		it('invoked [applica-info] command return correct result', function(done) {
			new Promise(function(resolved, rejected) {
				api
					.on('failed', function(result) {
						rejected(result);
					})
					.on('completed', function(result) {
						resolved(result);
					})
					.execCommand({
						name: 'applica-info',
						options: {}
					});
			}).then(function(result) {
				false && console.log(JSON.stringify(result, null, 2));
				assert.equal(result.state, "completed");
				assert.deepEqual(result.command, {
					"name": "applica-info",
					"options": {}
				});
				assert.deepEqual(result.payload, [
					{
						"type": "json",
						"title": "Application Information",
						"data": {
							"version": "0.1.0",
							"name": "demo-app",
							"description": "Devebot Demo Application",
							"author": "devebot",
							"license": "ISC",
							"layerware": [
								{
									"version": "0.1.1",
									"name": "plugin1",
									"description": "",
									"author": "devebot",
									"license": "ISC"
								},
								{
									"version": "0.1.2",
									"name": "plugin2",
									"description": "",
									"author": "devebot",
									"license": "ISC"
								}
							],
							"framework": lab.getFrameworkInfo()
						}
					}
				]);
				done();
			}).catch(done);
		});
	});

	describe('app.server', function() {
		var app, api;

		before(function() {
			app = lab.getApp();
			api = new DevebotApi(lab.getApiConfig());
		});

		beforeEach(function(done) {
			app.server.start().asCallback(done);
		});

		it('definition should contain [applica-info] command', function(done) {
			new Promise(function(resolved, rejected) {
				api.loadDefinition(function(err, obj) {
					if (err) return rejected(err);
					resolved(obj.payload);
				});
			}).then(function(defs) {
				var cmd = lodash.keyBy(defs.commands, 'name')['applica-info'];
				false && console.log(cmd);
				assert.isNotNull(cmd);
				assert.deepEqual(cmd, {
					package: 'devebot',
					name: 'applica-info',
					alias: 'app-info',
					description: 'Display application information',
					options: []
				});
				done();
			}).catch(done);
		});

		it('invoked [applica-info] command return correct result', function(done) {
			new Promise(function(resolved, rejected) {
				api
					.on('failed', function(result) {
						rejected(result);
					})
					.on('completed', function(result) {
						resolved(result);
					})
					.execCommand({
						name: 'applica-info',
						options: {}
					});
			}).then(function(result) {
				assert.equal(result.state, "completed");
				assert.deepEqual(result.command, {
					"name": "applica-info",
					"options": {}
				});
				assert.deepEqual(result.payload, [
					{
						"type": "json",
						"title": "Application Information",
						"data": {
							"version": "0.1.0",
							"name": "demo-app",
							"description": "Devebot Demo Application",
							"author": "devebot",
							"license": "ISC",
							"layerware": [
								{
									"version": "0.1.1",
									"name": "plugin1",
									"description": "",
									"author": "devebot",
									"license": "ISC"
								},
								{
									"version": "0.1.2",
									"name": "plugin2",
									"description": "",
									"author": "devebot",
									"license": "ISC"
								}
							],
							"framework": lab.getFrameworkInfo()
						}
					}
				]);
				done();
			}).catch(done);
		});

		afterEach(function(done) {
			app.server.stop().asCallback(done);
		});
	});
});
