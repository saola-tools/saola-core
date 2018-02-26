'use strict';

var lab = require('../lab');
var Devebot = lab.getDevebot();
var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');
var debugx = Devebot.require('pinbug')('bdd:devebot:core:configuration');
var assert = require('chai').assert;
var expect = require('chai').expect;
var util = require('util');

describe('devebot:configuration', function() {
	this.timeout(lab.getDefaultTimeout());
	var app;
	describe('default configuration (without profile & sandbox)', function() {
		before(function() {
			app = lab.getApp();
		});

		it('configuration has been loaded correctly', function(done) {
			app.runner.invoke(function(injektor) {
				var appinfo = injektor.lookup('appinfo');
				debugx.enabled && debugx('appinfo: %s', JSON.stringify(appinfo, null, 2));
				expect(appinfo).to.deep.include({
					"version": "0.1.0",
					"name": "demo-app",
					"description": "Devebot Demo Application",
					"author": "devebot",
					"license": "ISC",
					"framework": {
						"version": "0.2.5",
						"name": "devebot",
						"description": "Nodejs Microservice Framework",
						"homepage": "https://github.com/devebot/devebot#readme",
						"author": {
							"name": "Devebot",
							"email": "contact@devebot.com",
							"url": "https://github.com/devebot"
						},
						"license": "MIT"
					}
				});

				false && expect(appinfo).to.deep.include({
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
					]
				});

				var profileConfig = injektor.lookup('profileConfig');
				debugx.enabled && debugx('profileConfig: %s', JSON.stringify(profileConfig, null, 2));
				expect(profileConfig)
					.to.be.an('object')
					.to.include.all.keys('devebot');
				expect(profileConfig.devebot)
					.to.be.an('object')
					.to.include.all.keys('host', 'port', 'authen', 'tunnel');
				expect(profileConfig.devebot.authen)
					.to.be.an('object')
					.to.include.all.keys('disabled', 'tokenStoreFile');
				expect(profileConfig.devebot.tunnel)
					.to.be.an('object')
					.to.include.all.keys('enabled', 'key_file', 'crt_file');
			}).then(done);
		});
	});
});
