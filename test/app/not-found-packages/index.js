"use strict";

const lab = require("../../index");
const FRWK = lab.getFramework();

const app = FRWK.launchApplication({
  appRootPath: __dirname
}, [
  {
    name: "not-found-plugin",
    path: lab.getLibHome("not-found-plugin")
  }
], [
  {
    name: "not-found-bridge",
    path: lab.getLibHome("not-found-bridge")
  }
]);

if (require.main === module) app.server.start();

module.exports = app;
