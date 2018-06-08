'use strict';

var lab = require('../../../index');
var Devebot = lab.getDevebot();
var chores = Devebot.require('chores');

module.exports = {
  plugins: {
    wrapper2: {
      host: "localhost",
      port: 17732
    }
  },
  bridges: {
    "bridgeKebabCase1": {
      "devebot-dp-wrapper2": {
        "pointer": {
          "refPath": "sandbox -> bridge-kebab-case1 -> wrapper2 -> pointer",
          "refType": "wrapper2",
          "refName": "devebot-dp-wrapper2",
          "default": true
        }
      }
    },
    "bridgeKebabCase2": {
      "devebot-dp-wrapper2": {
        "pointer": {
          "refPath": "sandbox -> bridge-kebab-case2 -> wrapper2 -> pointer",
          "refType": "wrapper2",
          "refName": "devebot-dp-wrapper2",
          "default": true
        }
      }
    },
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
      "devebotDpWrapper2": {
        "bean": {
          "refPath": "sandbox -> connector2 -> wrapper2 -> bean",
          "refType": "wrapper2",
          "refName": "devebot-dp-wrapper2",
          "default": true
        }
      }
    }
  }
}

if (!chores.isFeatureSupported('bridge-full-ref')) {
  module.exports.bridges = {}
};