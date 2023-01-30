"use strict";

const lab = require("../../../index");

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
};

if (!lab.isUpgradeSupported("bridge-full-ref")) {
  module.exports.bridges = {
    "invalidInstance": {
      "bridgeInvalidDialect": {
        "refPath": "sandbox -> bridge-invalid-dialect -> invalid-instance"
      }
    }
  };
};
