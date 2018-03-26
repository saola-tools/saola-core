'use strict';

var lab = require('../../../index');
var Devebot = lab.getDevebot();
var chores = Devebot.require('chores');

module.exports = {
  application: {
    "host": "0.0.0.0",
    "port": 17700,
    "verbose": false
  },
  bridges: {
    "connector1": {
      "application": {
        "wrapper": {
          "refPath": "sandbox -> connector1 -> application -> wrapper",
          "refType": "application",
          "refName": "fullapp"
        }
      }
    },
    "connector2": {
      "application": {
        "wrapper": {
          "refPath": "sandbox -> connector2 -> application -> wrapper",
          "refType": "application",
          "refName": "fullapp"
        }
      }
    }
  },
  plugins: {
    "wrapper1": {
      "port": 17741
    },
    "wrapper2": {
      "port": 17742
    }
  }
}

if (!chores.isFeatureSupported('bridge-full-ref')) {
  module.exports.bridges = {}
};
