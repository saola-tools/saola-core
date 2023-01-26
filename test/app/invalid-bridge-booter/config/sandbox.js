"use strict";

var lab = require("../../../index");

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
};

if (!lab.isUpgradeSupported("bridge-full-ref")) {
  module.exports.bridges = {
    "invalidInstance": {
      "bridgeInvalidBooter": {
        "refPath": "sandbox -> bridge-invalid-booter -> invalid-instance"
      }
    }
  };
};
