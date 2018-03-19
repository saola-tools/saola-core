'use strict';

var lab = require('../../index');
var Devebot = lab.getDevebot();

var app = Devebot.launchApplication({
  appRootPath: __dirname
}, [
  {
    name: 'sub-plugin1',
    path: lab.getLibHome('sub-plugin1')
  },
  {
    name: 'sub-plugin2',
    path: lab.getLibHome('sub-plugin2')
  }
], [
  {
    name: 'bridge3',
    path: lab.getLibHome('bridge3')
  },
  {
    name: 'bridge4',
    path: lab.getLibHome('bridge4')
  },
  {
    name: 'devebot-co-connector1',
    path: lab.getLibHome('devebot-co-connector1')
  },
  {
    name: 'devebot-co-connector2',
    path: lab.getLibHome('devebot-co-connector2')
  }
]);

if (require.main === module) app.server.start();

module.exports = app;
