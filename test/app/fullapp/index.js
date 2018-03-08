'use strict';

var lab = require('../../index');
var Devebot = lab.getDevebot();

var app = Devebot.launchApplication({
  appRootPath: __dirname
}, [
	{
		name: 'sublib1',
		path: lab.getLibHome('sublib1')
	},
	{
		name: 'sublib2',
		path: lab.getLibHome('sublib2')
	}
], [
	{
		name: 'bridge3',
		path: lab.getLibHome('bridge3')
	},
	{
		name: 'bridge4',
		path: lab.getLibHome('bridge4')
	}
]);

if (require.main === module) app.server.start();

module.exports = app;
