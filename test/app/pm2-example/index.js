'use strict';

var Devebot = require('../../index').getDevebot();

var app = Devebot.launchApplication({
  appRootPath: __dirname
}, [], []);

if (require.main === module) app.server.start();

console.log('PM2_id: %s / Total: %s', process.env.pm_id, process.env.instances);

module.exports = app;
