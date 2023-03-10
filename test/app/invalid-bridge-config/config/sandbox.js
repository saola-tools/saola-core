"use strict";

const lab = require("../../../index");

// swaps the values of 'host' <=> 'port'
module.exports = {
  bridges: {
    "bridgeInvalidConfig": {
      "application": {
        "invalidInstance": {
          "host": 17779,
          "port": "0.0.0.0"
        }
      }
    }
  }
};

if (!lab.isUpgradeSupported("bridge-full-ref")) {
  module.exports.bridges = {
    "invalidInstance": {
      "bridgeInvalidConfig": {
        "host": 17779,
        "port": "0.0.0.0"
      }
    }
  };
};
