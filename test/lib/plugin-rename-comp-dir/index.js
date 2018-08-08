'use strict';

var lab = require('../../index');
var devebot = lab.getDevebot();

module.exports = devebot.registerLayerware({
  presets: {
    componentDir: {
      ROUTINE: '/lib/comp1',
      SERVICE: '/lib/comp2',
      TRIGGER: '/lib/comp_triggers'
    }
  }
}, [], []);
