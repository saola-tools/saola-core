"use strict";

const lab = require("../../index");
const FRWK = lab.getFramework();

const app = FRWK.launchApplication({
  appRootPath: __dirname
}, [
  {
    name: lab.getPrefixScopedName() + "plugin-case0",
    path: lab.getLibHome("scoped-pkg-plugin-case0")
  }
], [
  {
    name: lab.getPrefixScopedName() + "bridge-case0",
    path: lab.getLibHome("scoped-pkg-bridge-case0")
  },
  {
    name: lab.getPrefixScopedName() + "bridge-case1",
    path: lab.getLibHome("scoped-pkg-bridge-case1")
  },
  {
    name: lab.getPrefixScopedName() + "bridge-case2",
    path: lab.getLibHome("scoped-pkg-bridge-case2")
  }
]);

if (require.main === module) app.server.start();

module.exports = app;
