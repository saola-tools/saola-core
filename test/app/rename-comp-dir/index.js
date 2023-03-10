"use strict";

const lab = require("../../index");
const FRWK = lab.getFramework();

const app = FRWK.launchApplication({
  appRootPath: __dirname,
  presets: {
    componentDir: {
      ROUTINE: "/lib/routines",
      SERVICE: "lib/services",
      TRIGGER: "./lib/servlets"
    }
  }
}, [
  {
    name: "plugin-rename-comp-dir",
    path: lab.getLibHome("plugin-rename-comp-dir"),
    presets: {
      componentDir: {
        TRIGGER: "/lib/comp3"
      }
    }
  }
], []);

if (require.main === module) app.server.start();

module.exports = app;
