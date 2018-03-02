'use strict';

var constx = require('../lib/utils/constx');
var fs = require('fs');
var lodash = require('lodash');
var path = require('path');

module.exports = {
	getApiConfig: function(ext) {
		ext = ext || {};
		return lodash.merge({
			host: '127.0.0.1',
			port: 17779,
			path: '/demo-app',
			authen: {
				token_key: 'devebot',
				token_secret: 's3cr3tpa$$w0rd'
			},
			stateMap: {
				"definition": "definition",
				"started": "started",
				"progress": "progress",
				"timeout": "timeout",
				"failed": "failed",
				"cancelled": "cancelled",
				"completed": "completed",
				"done": "done",
				"noop": "noop"
			}
		}, ext);
	},
	getAppHome: function(appName) {
		return path.join(__dirname, 'app', appName);
	},
	getApp: function(appName) {
		appName = appName || 'default';
		return require(this.getAppHome(appName));
	},
	getAppCfgDir: function(appName, cfgName) {
		cfgName = cfgName || 'config';
		return path.join(__dirname, 'app', appName, cfgName);
	},
	getLibHome: function(libName) {
		return path.join(__dirname, './lib/', libName);
	},
	getLib: function(libName) {
		return require(this.getLibHome(libName));
	},
	getLibCfgDir: function(libName) {
		return path.join(this.getLibHome(libName), 'config');
	},
	getDevebotHome: function() {
		return path.join(__dirname, '../');
	},
	getDevebot: function() {
		return require(this.getDevebotHome());
	},
	getDevebotCfgDir: function() {
		return path.join(this.getDevebotHome(), 'config');
	},
	getDefaultTimeout: function() {
		return 60000;
	},
	getFrameworkInfo: function() {
		try {
			var pkgFile = this.getDevebotHome() + '/package.json';
			return lodash.pick(JSON.parse(fs.readFileSync(pkgFile, 'utf8')), constx.APPINFO.FIELDS);
		} catch(err) {
			return {};
		}
	}
}