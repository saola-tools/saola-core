"use strict";

var lab = require("../../index");
var Devebot = lab.getDevebot();

var app = Devebot.launchApplication({
  appRootPath: __dirname
}, [], [
  {
    name: "bridge-invalid-booter",
    path: lab.getLibHome("bridge-invalid-booter")
  }
]);

if (require.main === module) app.server.start();

module.exports = app;
