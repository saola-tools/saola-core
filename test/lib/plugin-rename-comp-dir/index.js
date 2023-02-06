"use strict";

const lab = require("../../index");
const Devebot = lab.getFramework();

module.exports = Devebot.registerLayerware({
  presets: {
    componentDir: {
      ROUTINE: "/lib/comp1",
      SERVICE: "/lib/comp2",
      TRIGGER: "/lib/comp_triggers"
    }
  }
}, [], []);
