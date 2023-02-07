"use strict";

const lab = require("../../index");
const FRWK = lab.getFramework();

const app = FRWK.launchApplication({
  appRootPath: __dirname
}, [
  {
    name: "sub-plugin1",
    path: lab.getLibHome("sub-plugin1")
  },
  {
    name: "sub-plugin2",
    path: lab.getLibHome("sub-plugin2")
  }
]);

if (require.main === module) app.server.start();

module.exports = app;
