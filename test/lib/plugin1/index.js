var lab = require('../../index');

module.exports = Devebot.registerLayerware(__dirname, [], [
  {
    name: 'bridge1',
    path: lab.getLibHome('bridge1')
  }
]);
