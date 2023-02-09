"use strict";

const lab = require("../../index");
const FRWK = lab.getFramework();

const constx = require(lab.getFrameworkModule("utils/constx"));
const FRAMEWORK_NAMESPACE = constx.FRAMEWORK.NAMESPACE;

const app = FRWK.launchApplication({
  appRootPath: __dirname
}, [
  {
    name: FRAMEWORK_NAMESPACE + "-dp-backward1",
    formers: [ "sub-plugin1" ],
    path: lab.getLibHome("namespace-dp-backward1")
  },
  {
    name: FRAMEWORK_NAMESPACE + "-dp-backward2",
    formers: [ "sub-plugin2" ],
    path: lab.getLibHome("namespace-dp-backward2")
  }
], [
  {
    name: FRAMEWORK_NAMESPACE + "-co-backward1",
    formers: [ "bridge-kebab-case1" ],
    path: lab.getLibHome("namespace-co-backward1")
  },
  {
    name: FRAMEWORK_NAMESPACE + "-co-backward2",
    formers: [ "bridge-kebab-case2" ],
    path: lab.getLibHome("namespace-co-backward2")
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
