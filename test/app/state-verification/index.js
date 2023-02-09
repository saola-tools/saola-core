"use strict";

const lab = require("../../index");
const FRWK = lab.getFramework().parseArguments(require.main === module);

const constx = require(lab.getFrameworkModule("utils/constx"));
const FRAMEWORK_NAMESPACE = constx.FRAMEWORK.NAMESPACE;

const app = FRWK.launchApplication({
  appRootPath: __dirname,
  defaultFeatures: ["def", "xyz"]
}, [
  {
    name: FRAMEWORK_NAMESPACE + "-dp-wrapper1",
    path: lab.getLibHome("namespace-dp-wrapper1")
  },
  {
    name: FRAMEWORK_NAMESPACE + "-dp-wrapper2",
    path: lab.getLibHome("namespace-dp-wrapper2")
  }
], [
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
