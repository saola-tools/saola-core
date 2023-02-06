"use strict";

const lab = require("../../index");
const Devebot = lab.getFramework();

const app = Devebot.launchApplication({
  appRootPath: __dirname
});

if (require.main === module) app.server.start();

module.exports = app;
