"use strict";

const lab = require("../../index");
const Devebot = lab.getDevebot();

const app = Devebot.launchApplication({
  appRootPath: __dirname
}, [], [
  {
    name: "bridge-invalid-dialect",
    path: lab.getLibHome("bridge-invalid-dialect")
  }
]);

if (require.main === module) app.server.start();

module.exports = app;
