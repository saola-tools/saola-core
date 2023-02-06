"use strict";

const lab = require("../../index");
const Devebot = lab.getFramework();

const app = Devebot.launchApplication({
  appRootPath: __dirname
}, [], [
  {
    name: "bridge-invalid-booter",
    path: lab.getLibHome("bridge-invalid-booter")
  }
]);

if (require.main === module) app.server.start();

module.exports = app;
