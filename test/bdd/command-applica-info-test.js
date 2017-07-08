'use strict';

var lab = require('../lab');
var Devebot = lab.getDevebot();
var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');
var debug = Devebot.require('debug');
var assert = require('chai').assert;
var expect = require('chai').expect;
var util = require('util');
var debugx = debug('bdd:devebot:command:applica:info');
var DevebotApi = require('devebot-api');

describe('devebot:command:applica:info', function() {
	this.timeout(60000);
	var app, api;

	before(function() {
		app = lab.getApp();
		api = new DevebotApi(lab.getApiConfig());
	});

	beforeEach(function(done) {
		app.server.start().then(function() {
			done();
		});
	});

	afterEach(function(done) {
		app.server.teardown().then(function() {
			done();
		});
	});

	it('definition should contain [applica-info] command', function(done) {
		new Promise(function(resolved, rejected) {
			api.loadDefinition(function(err, defs) {
				if (err) return rejected(err);
				resolved(defs);
			});
		}).then(function(defs) {
			var cmd = lodash.keyBy(defs.commands, 'name')['applica-info'];
			assert.isNotNull(cmd);
			done();
		});
	});

	it('invoked [applica-info] command return correct result', function(done) {
		new Promise(function(resolved, rejected) {
			api.on('failure', function(result) {
				rejected(result);
			});
			api.on('success', function(result) {
				resolved(result);
			});
			api.execCommand({
				name: 'applica-info',
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
});
