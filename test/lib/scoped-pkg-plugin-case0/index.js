/* global Devebot */
"use strict";

const path = require("path");

module.exports = Devebot.registerLayerware(__dirname, [], [
  {
    name: "@devebot/bridge-case0",
    path: path.join(__dirname, "../", "scoped-pkg-bridge-case0")
  },
]);
