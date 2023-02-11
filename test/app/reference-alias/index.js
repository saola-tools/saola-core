"use strict";

const lab = require("../../index");
const FRWK = lab.getFramework();

const app = FRWK.launchApplication({
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
