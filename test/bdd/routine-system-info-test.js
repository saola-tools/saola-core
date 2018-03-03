'use strict';

var lab = require('../index');
var Devebot = lab.getDevebot();
var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');
var debugx = Devebot.require('pinbug')('bdd:devebot:command:system:info');
var assert = require('chai').assert;
var expect = require('chai').expect;
var util = require('util');
var DevebotApi = require('devebot-api');

describe('devebot:command:system:info', function() {
	this.timeout(lab.getDefaultTimeout());

	var app, api;

	before(function() {
		app = lab.getApp();
		api = new DevebotApi(lab.getApiConfig());
	});

	beforeEach(function(done) {
		app.server.start().asCallback(done);
	});

	it('definition should contain [system-info] command', function(done) {
		new Promise(function(resolved, rejected) {
			api.loadDefinition(function(err, defs) {
				if (err) return rejected(err);
				resolved(defs);
			});
		}).then(function(defs) {
			var cmd = lodash.keyBy(defs.commands, 'name')['system-info'];
			assert.isNotNull(cmd);
			done();
		});
	});

	it('invoked [system-info] command return correct result', function(done) {
		new Promise(function(resolved, rejected) {
			api.on('failed', function(result) {
				rejected(result);
			});
			api.on('completed', function(result) {
				resolved(result);
			});
			api.execCommand({
				name: 'system-info',
				options: {}
			});
		}).then(function(result) {
			debugx.enabled && debugx(JSON.stringify(result, null, 2));
			done();
		}).catch(function(error) {
			debugx.enabled && debugx(JSON.stringify(error, null, 2));
			done(error);
		});
	});

	afterEach(function(done) {
		app.server.teardown().asCallback(done);
	});
});
