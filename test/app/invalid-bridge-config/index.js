"use strict";

const lab = require("../../index");
const Devebot = lab.getDevebot();

const app = Devebot.launchApplication({
  appRootPath: __dirname
}, [], [
  {
    name: "bridge-invalid-config",
    path: lab.getLibHome("bridge-invalid-config")
  }
]);

if (require.main === module) app.server.start();

module.exports = app;
