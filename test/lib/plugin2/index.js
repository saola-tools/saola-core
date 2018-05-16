var lab = require('../../index');

module.exports = Devebot.registerLayerware({
  layerRootPath: __dirname,
  configTags: 'bridge[dialect-bridge]'
}, [], [
  {
    name: 'bridge1',
    path: lab.getLibHome('bridge1')
  },
  {
    name: 'bridge2',
    path: lab.getLibHome('bridge2')
  }
]);
