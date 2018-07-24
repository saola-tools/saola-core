'use strict';

var lab = require('../../index');
var Devebot = lab.getDevebot();
var chores = Devebot.require('chores');
var app = Devebot.initialize('features', {
  defaultFeatures: ['abc', 'def']
}).launchApplication({
  appRootPath: __dirname
}, [], []);

app.server;

console.log('PM2_id: %s / Total: %s', process.env.pm_id, process.env.instances);

console.log('isFeatureSupport: [%s]', lab.isFeatureSupported('abcd'));

if (require.main === module) app.server.start();

module.exports = app;
