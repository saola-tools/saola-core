'use strict';

var lab = require('../../index');
var Devebot = lab.getDevebot();

var app = Devebot.launchApplication({
  appRootPath: __dirname,
  presets: {
    componentDir: {
      ROUTINE: '/lib/routines',
      SERVICE: '/lib/services',
      TRIGGER: '/lib/servlets'
    }
  }
}, [
  {
    name: 'plugin-rename-comp-dir',
    path: lab.getLibHome('plugin-rename-comp-dir')
  }
], []);

if (require.main === module) app.server.start();

module.exports = app;
