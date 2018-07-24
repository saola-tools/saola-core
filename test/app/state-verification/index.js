'use strict';

var lab = require('../../index');
var Devebot = lab.getDevebot().parseArguments(require.main === module);

var app = Devebot.launchApplication({
  appRootPath: __dirname,
  presets: {
    defaultFeatures: ['def', 'xyz']
  }
}, [
  {
    name: 'devebot-dp-wrapper1',
    path: lab.getLibHome('devebot-dp-wrapper1')
  },
  {
    name: 'devebot-dp-wrapper2',
    path: lab.getLibHome('devebot-dp-wrapper2')
  }
], [
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
