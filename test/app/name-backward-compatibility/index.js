"use strict";

const lab = require("../../index");
const FRWK = lab.getFramework();

const app = FRWK.launchApplication({
  appRootPath: __dirname
}, [
  {
    name: "devebot-dp-backward1",
    formers: [ "sub-plugin1" ],
    path: lab.getLibHome("namespace-dp-backward1")
  },
  {
    name: "devebot-dp-backward2",
    formers: [ "sub-plugin2" ],
    path: lab.getLibHome("namespace-dp-backward2")
  }
], [
  {
    name: "devebot-co-connector1",
    path: lab.getLibHome("namespace-co-connector1")
  },
  {
    name: "devebot-co-connector2",
    path: lab.getLibHome("namespace-co-connector2")
  }
]);

if (require.main === module) app.server.start();

module.exports = app;
