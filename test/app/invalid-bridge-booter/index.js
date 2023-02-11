"use strict";

const lab = require("../../index");
const FRWK = lab.getFramework();

const app = FRWK.launchApplication({
  appRootPath: __dirname
}, [], [
  {
    name: "bridge-invalid-booter",
    path: lab.getLibHome("bridge-invalid-booter")
  }
]);

if (require.main === module) app.server.start();

module.exports = app;
