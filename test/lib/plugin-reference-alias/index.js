"use strict";

const lab = require("../../index");
const devebot = lab.getFramework();

module.exports = devebot.registerLayerware({
  presets: {
    componentDir: {
      ROUTINE: "/lib/comp1",
      SERVICE: "/lib/comp2",
      TRIGGER: "/lib/comp3"
    }
  }
}, [], []);
