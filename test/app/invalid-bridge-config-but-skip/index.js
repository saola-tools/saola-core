'use strict';

var lab = require('../../index');
var Devebot = lab.getDevebot();

var app = Devebot.launchApplication({
  appRootPath: __dirname
}, [], [
  {
    name: 'bridge-invalid-config',
    path: lab.getLibHome('bridge-invalid-config'),
    presets: {
      schemaValidation: false
    }
  }
]);

if (require.main === module) app.server.start();

module.exports = app;
