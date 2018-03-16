var lab = require('../../index');

module.exports = Devebot.registerLayerware(__dirname, [], [
  {
    name: 'bridge2',
    path: lab.getLibHome('bridge2')
  }
]);
