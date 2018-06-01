'use strict';

var path = require('path');
var argv = require('minimist')(process.argv.slice(2));
console.log('Command arguments: %s', JSON.stringify(argv, null, 2));

var appName = argv['app'] || argv['a'] || 'default';

var main = require(path.join(__dirname, '../index')).getApp(appName);
main.runner.invoke(function(injektor) {
	console.log('Profile config: %s', JSON.stringify(injektor.lookup('profileConfig'), null, 2));
	return Promise.resolve();
});
