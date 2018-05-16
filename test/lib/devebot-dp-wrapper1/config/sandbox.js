'use strict';

var lab = require('../../../index');
var Devebot = lab.getDevebot();
var chores = Devebot.require('chores');

module.exports = {
  plugins: {
    wrapper1: {
      host: "localhost",
      port: 17731
    }
  },
  bridges: {
    "connector1": {
      "devebot-dp-wrapper1": {
        "bean": {
          "refPath": "sandbox -> connector1 -> wrapper1 -> bean",
          "refType": "wrapper1",
          "refName": "devebot-dp-wrapper1",
          "default": true
        }
      }
    },
    "connector2": {
      "devebot-dp-wrapper1": {
        "bean": {
          "refPath": "sandbox -> connector2 -> wrapper1 -> bean",
          "refType": "wrapper1",
          "refName": "devebot-dp-wrapper1",
          "default": true
        }
      }
    }
  }
}

if (!chores.isFeatureSupported('bridge-full-ref')) {
  module.exports.bridges = {}
};