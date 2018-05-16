'use strict';

var lab = require('../../index');
var devebot = lab.getDevebot();

module.exports = devebot.registerLayerware(__dirname, [], [
  {
    name: 'devebot-co-connector1',
    path: lab.getLibHome('devebot-co-connector1')
  },
  {
    name: 'devebot-co-connector2',
    path: lab.getLibHome('devebot-co-connector2')
  }
]);
