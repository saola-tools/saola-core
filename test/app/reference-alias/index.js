"use strict";

var lab = require("../../index");
var Devebot = lab.getDevebot();

var app = Devebot.launchApplication({
  appRootPath: __dirname,
  presets: {
    componentDir: {
      TRIGGER: "./lib/servlets"
    },
    referenceAlias: {
      "addonService": "sublibService",
      "addonTrigger": "plugin-reference-alias/sublibTrigger"
    }
  }
}, [
  {
    name: "plugin-reference-alias",
    path: lab.getLibHome("plugin-reference-alias")
  }
], []);

if (require.main === module) app.server.start();

module.exports = app;
