"use strict";

const lab = require("../../index");
const FRWK = lab.getFramework();

module.exports = FRWK.registerLayerware({
  presets: {
    componentDir: {
      ROUTINE: "/lib/comp1",
      SERVICE: "/lib/comp2",
      TRIGGER: "/lib/comp_triggers"
    }
  }
}, [], []);
