"use strict";

const lab = require("../../../index");

module.exports = {
  plugins: {
    wrapper1: {
      host: "localhost",
      port: 17731
    }
  },
  bridges: {
    "bridgeKebabCase1": {
      "devebot-dp-wrapper1": {
        "pointer": {
          "refPath": "sandbox -> bridge-kebab-case1 -> wrapper1 -> pointer",
          "refType": "wrapper1",
          "refName": "namespace-dp-wrapper1",
          "default": true
        }
      }
    },
    "bridgeKebabCase2": {
      "devebot-dp-wrapper1": {
        "pointer": {
          "refPath": "sandbox -> bridge-kebab-case2 -> wrapper1 -> pointer",
          "refType": "wrapper1",
          "refName": "namespace-dp-wrapper1",
          "default": true
        }
      }
    },
    "connector1": {
      "devebotDpWrapper1": {
        "bean": {
          "refPath": "sandbox -> connector1 -> wrapper1 -> bean",
          "refType": "wrapper1",
          "refName": "namespace-dp-wrapper1",
          "default": true
        }
      }
    },
    "connector2": {
      "devebot-dp-wrapper1": {
        "bean": {
          "refPath": "sandbox -> connector2 -> wrapper1 -> bean",
          "refType": "wrapper1",
          "refName": "namespace-dp-wrapper1",
          "default": true
        }
      }
    }
  }
};

if (!lab.isUpgradeSupported("bridge-full-ref")) {
  module.exports.bridges = {};
};
