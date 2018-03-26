'use strict';

var lab = require('../../../index');
var Devebot = lab.getDevebot();
var chores = Devebot.require('chores');

module.exports = {
  bridges: {
    "bridgeInvalidBooter": {
      "application": {
        "invalidInstance": {
          "refPath": "sandbox -> bridge-invalid-booter -> application -> invalid-instance",
          "refType": "application",
          "refName": "invalid-bridge-booter"
        }
      }
    }
  }
}

if (!chores.isFeatureSupported('bridge-full-ref')) {
  module.exports.bridges = {
    "invalidInstance": {
      "bridgeInvalidBooter": {
        "refPath": "sandbox -> bridge-invalid-booter -> invalid-instance"
      }
    }
  }
};
