'use strict';

var lab = require('../../index');
var Devebot = lab.getDevebot();

var app = Devebot.launchApplication({
  appRootPath: __dirname
}, [
  {
    name: 'sub-plugin1',
    path: lab.getLibHome('sub-plugin1'),
    presets: {
      schemaValidation: false
    }
  },
  {
    name: 'sub-plugin2',
    path: lab.getLibHome('sub-plugin2'),
    presets: {
      schemaValidation: false
    }
  }
]);

if (require.main === module) app.server.start();

module.exports = app;
