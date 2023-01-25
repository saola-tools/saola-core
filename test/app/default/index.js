"use strict";

const lab = require("../../index");
const Devebot = lab.getDevebot();

const app = Devebot.launchApplication({
  appRootPath: __dirname
}, [
  {
    name: "plugin1",
    path: lab.getLibHome("plugin1")
  },
  {
    name: "plugin2",
    path: lab.getLibHome("plugin2")
  }
], [
  {
    name: "bridge1",
    path: lab.getLibHome("bridge1")
  },
  {
    name: "bridge2",
    path: lab.getLibHome("bridge2")
  }
]);

if (require.main === module) app.server.start();

module.exports = app;
