'use strict';

var lab = require('../../../index');
var Devebot = lab.getDevebot();
var chores = Devebot.require('chores');

module.exports = {
  bridges: {
    "bridgeInvalidDialect": {
      "application": {
        "invalidInstance": {
          "refPath": "sandbox -> bridge-invalid-dialect -> application -> invalid-instance",
          "refType": "application",
          "refName": "invalid-bridge-dialect"
        }
      }
    }
  }
}

if (chores.isOldFeatures()) {
  module.exports.bridges = {
    "invalidInstance": {
      "bridgeInvalidDialect": {
        "refPath": "sandbox -> bridge-invalid-dialect -> invalid-instance"
      }
    }
  }
};
