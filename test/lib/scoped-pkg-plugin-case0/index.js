"use strict";

const path = require("path");

module.exports = FRWK.registerLayerware(__dirname, [], [
  {
    name: "@devebot/bridge-case0",
    path: path.join(__dirname, "../", "scoped-pkg-bridge-case0")
  },
]);
