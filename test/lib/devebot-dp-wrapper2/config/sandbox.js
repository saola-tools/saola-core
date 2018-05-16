'use strict';

var lab = require('../../../index');
var Devebot = lab.getDevebot();
var chores = Devebot.require('chores');

module.exports = {
  bridges: {
    "connector1": {
      "devebot-dp-wrapper2": {
        "bean": {
          "refPath": "sandbox -> connector1 -> wrapper2 -> bean",
          "refType": "wrapper2",
          "refName": "devebot-dp-wrapper2",
          "default": true
        }
      }
    },
    "connector2": {
      "devebot-dp-wrapper2": {
        "bean": {
          "refPath": "sandbox -> connector2 -> wrapper2 -> bean",
          "refType": "wrapper2",
          "refName": "devebot-dp-wrapper2",
          "default": true
        }
      }
    }
  },
  plugins: {
    wrapper2: {
      host: "localhost",
      port: 17732
    }
  }
}

if (!chores.isFeatureSupported('bridge-full-ref')) {
  module.exports.bridges = {}
};