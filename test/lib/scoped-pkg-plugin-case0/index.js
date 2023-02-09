"use strict";

const path = require("path");

const lab = require("../../index");
const FRWK = lab.getFramework();

module.exports = FRWK.registerLayerware(__dirname, [], [
  {
    name: lab.getPrefixScopedName() + "bridge-case0",
    path: path.join(__dirname, "../", "scoped-pkg-bridge-case0")
  },
]);
