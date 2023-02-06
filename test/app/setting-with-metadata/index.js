"use strict";

const lab = require("../../index");
const Devebot = lab.getFramework();

const app = Devebot.initialize("tasks").launchApplication({
  appRootPath: __dirname
}, [
  {
    name: "sub-plugin3",
    path: lab.getLibHome("sub-plugin3")
  },
  {
    name: "sub-plugin4",
    path: lab.getLibHome("sub-plugin4")
  },
  {
    name: "plugin4",
    path: lab.getLibHome("plugin4")
  },
], [
  {
    name: "devebot-co-adapter",
    path: lab.getLibHome("framework-co-adapter")
  },
  {
    name: "bridge4",
    path: lab.getLibHome("bridge4")
  },
]);

if (require.main === module) app.server.start();

module.exports = app;
