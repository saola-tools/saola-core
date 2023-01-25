"use strict";

const lab = require("../../index");
const Devebot = lab.getDevebot();

const app = Devebot.launchApplication({
  appRootPath: __dirname
}, [
  {
    name: "@devebot/plugin-case0",
    path: lab.getLibHome("scoped-pkg-plugin-case0")
  }
], [
  {
    name: "@devebot/bridge-case0",
    path: lab.getLibHome("scoped-pkg-bridge-case0")
  },
  {
    name: "@devebot/bridge-case1",
    path: lab.getLibHome("scoped-pkg-bridge-case1")
  },
  {
    name: "@devebot/bridge-case2",
    path: lab.getLibHome("scoped-pkg-bridge-case2")
  }
]);

if (require.main === module) app.server.start();

module.exports = app;
