"use strict";

const lab = require("../../index");
const Devebot = lab.getFramework().parseArguments(require.main === module);

const app = Devebot.launchApplication({
  appRootPath: __dirname,
  defaultFeatures: ["def", "xyz"]
}, [
  {
    name: "devebot-dp-wrapper1",
    path: lab.getLibHome("framework-dp-wrapper1")
  },
  {
    name: "devebot-dp-wrapper2",
    path: lab.getLibHome("framework-dp-wrapper2")
  }
], [
  {
    name: "devebot-co-connector1",
    path: lab.getLibHome("framework-co-connector1")
  },
  {
    name: "devebot-co-connector2",
    path: lab.getLibHome("framework-co-connector2")
  }
]);

if (require.main === module) app.server.start();

module.exports = app;
