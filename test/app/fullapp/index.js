"use strict";

const lab = require("../../index");
const FRWK = lab.getFramework();

const constx = require(lab.getFrameworkModule("utils/constx"));
const FRAMEWORK_NAMESPACE = constx.FRAMEWORK.NAMESPACE;

const app = FRWK.launchApplication({
  appRootPath: __dirname
}, [
  {
    name: "sub-plugin1",
    path: lab.getLibHome("sub-plugin1")
  },
  {
    name: "sub-plugin2",
    path: lab.getLibHome("sub-plugin2")
  }
], [
  {
    name: "bridge3",
    path: lab.getLibHome("bridge3")
  },
  {
    name: "bridge4",
    path: lab.getLibHome("bridge4")
  },
  {
    name: FRAMEWORK_NAMESPACE + "-co-connector1",
    path: lab.getLibHome("namespace-co-connector1")
  },
  {
    name: FRAMEWORK_NAMESPACE + "-co-connector2",
    path: lab.getLibHome("namespace-co-connector2")
  }
]);

if (require.main === module) app.server.start();

module.exports = app;
