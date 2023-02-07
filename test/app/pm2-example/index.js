"use strict";

const lab = require("../../index");
const FRWK = lab.getFramework();
const chores = FRWK.require("chores");

const app = FRWK.initialize("features", {
  defaultFeatures: ["abc", "def"]
}).launchApplication({
  appRootPath: __dirname
}, [], []);

chores.logConsole("PM2_id: %s / Total: %s", process.env.pm_id, process.env.instances);

chores.logConsole("isFeatureSupport: [%s]", lab.isUpgradeSupported("abcd"));

if (require.main === module) {
  app.server.start();
}

module.exports = app;
