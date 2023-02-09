"use strict";

const lab = require("../../index");
const FRWK = lab.getFramework();

const constx = require(lab.getFrameworkModule("utils/constx"));
const FRAMEWORK_NAMESPACE = constx.FRAMEWORK.NAMESPACE;

const app = FRWK.initialize("tasks").launchApplication({
  appRootPath: __dirname
}, [
  {
    name: "sub-plugin3",
    path: lab.getLibHome("sub-plugin3")
  },
  {
    name: "sub-plugin4",
    path: lab.getLibHome("sub-plugin4")
  },
  {
    name: "plugin4",
    path: lab.getLibHome("plugin4")
  },
], [
  {
    name: FRAMEWORK_NAMESPACE + "-co-adapter",
    path: lab.getLibHome("namespace-co-adapter")
  },
  {
    name: "bridge4",
    path: lab.getLibHome("bridge4")
  },
]);

if (require.main === module) app.server.start();

module.exports = app;
