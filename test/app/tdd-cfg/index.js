"use strict";

const Devebot = require("../../index").getFramework();

const app = Devebot.launchApplication({
  appRootPath: __dirname
}, [], []);

if (require.main === module) app.server.start();

module.exports = app;
