"use strict";

const lab = require("../../index");
const Devebot = lab.getFramework();

const app = Devebot.launchApplication({
  appRootPath: __dirname
}, [
  {
    name: "plugin-invalid-trigger-methods",
    path: lab.getLibHome("plugin-invalid-trigger-methods")
  }
]);

if (require.main === module) app.server.start();

module.exports = app;
