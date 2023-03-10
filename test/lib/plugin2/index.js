const lab = require("../../index");

module.exports = FRWK.registerLayerware({
  layerRootPath: __dirname,
  presets: {
    configTags: "bridge[dialect-bridge]"
  }
}, [], [
  {
    name: "bridge1",
    path: lab.getLibHome("bridge1")
  },
  {
    name: "bridge2",
    path: lab.getLibHome("bridge2")
  }
]);
