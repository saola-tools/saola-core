"use strict";

const lab = require("../../index");
const FRWK = lab.getFramework();

const app = FRWK.launchApplication({
  appRootPath: __dirname
}, [
  {
    name: "plugin-invalid-booter",
    path: lab.getLibHome("plugin-invalid-booter")
  }
]);

if (require.main === module) app.server.start();

module.exports = app;
