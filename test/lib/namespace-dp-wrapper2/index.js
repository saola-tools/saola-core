"use strict";

const lab = require("../../index");
const FRWK = lab.getFramework();

const constx = require(lab.getFrameworkModule("utils/constx"));
const FRAMEWORK_NAMESPACE = constx.FRAMEWORK.NAMESPACE;

module.exports = FRWK.registerLayerware(__dirname, [], [
  {
    name: "bridge-kebab-case1",
    path: lab.getLibHome("bridge-kebab-case1")
  },
  {
    name: "bridge-kebab-case2",
    path: lab.getLibHome("bridge-kebab-case2")
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
