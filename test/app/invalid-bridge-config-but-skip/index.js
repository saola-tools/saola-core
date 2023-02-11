"use strict";

const lab = require("../../index");
const FRWK = lab.getFramework();

const app = FRWK.launchApplication({
  appRootPath: __dirname
}, [], [
  {
    name: "bridge-invalid-config",
    path: lab.getLibHome("bridge-invalid-config"),
    presets: {
      schemaValidation: false
    }
  }
]);

if (require.main === module) app.server.start();

module.exports = app;
