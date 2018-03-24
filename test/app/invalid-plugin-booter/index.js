'use strict';

var lab = require('../../index');
var Devebot = lab.getDevebot();

var app = Devebot.launchApplication({
  appRootPath: __dirname
}, [
  {
    name: 'plugin-invalid-booter',
    path: lab.getLibHome('plugin-invalid-booter')
  }
]);

if (require.main === module) app.server.start();

module.exports = app;
