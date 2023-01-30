"use strict";

const Devebot = require("../../index").getDevebot();

const app = Devebot.launchApplication({
  appRootPath: __dirname
}, [], []);

if (require.main === module) app.server.start();

module.exports = app;
