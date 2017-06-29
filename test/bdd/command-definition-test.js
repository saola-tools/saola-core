'use strict';

var lab = require('../lab');
var DevebotApi = require('devebot-api');
var Devebot = require('../lab/index').getDevebot();
var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');
var debug = Devebot.require('debug');
var assert = require('chai').assert;
var expect = require('chai').expect;
var util = require('util');
var debugx = debug('bdd:devebot:core:configuration');

describe('devebot:command:definition', function() {
	this.timeout(60000);
	var app, api;

	before(function() {
		app = lab.getApp();
		api = new DevebotApi(lab.getApiConfig());
	});

	it('definition should contain default commands', function(done) {
		app.server.start().then(function() {
			return new Promise(function(resolved, rejected) {
				api.loadDefinition(function(err, defs) {
					if (err) return rejected(err);
					resolved(defs);
				});
			}).then(function(defs) {
				var cmdNames = lodash.map(defs.commands, function(cmd) {
					return cmd.name;
				});
				assert.includeMembers(cmdNames, [
					'app-info',
					'log-info', 'log-reset', 'log-set',
					'sb-info', 'sb-use',
					'sys-info'
				]);
				lodash.forEach(defs.commands, function(cmd) {
					assert.containsAllKeys(cmd, ['name', 'description', 'options']);
				});
				false && console.log('Definition: %s', JSON.stringify(defs, null, 2));
				return app.server.teardown();
			});
		}).then(function() {
			done();
		});
	});
});