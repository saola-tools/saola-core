"use strict";

const lab = require("../../../index");

const constx = require(lab.getFrameworkModule("utils/constx"));
const FRAMEWORK_NAMESPACE = constx.FRAMEWORK.NAMESPACE;

module.exports = {
  plugins: {
    wrapper2: {
      host: "localhost",
      port: 17732
    }
  },
  bridges: {
    "bridgeKebabCase1": {
      [FRAMEWORK_NAMESPACE + "-dp-wrapper2"]: {
        "pointer": {
          "refPath": "sandbox -> bridge-kebab-case1 -> wrapper2 -> pointer",
          "refType": "wrapper2",
          "refName": "namespace-dp-wrapper2",
          "default": true
        }
      }
    },
    "bridgeKebabCase2": {
      [FRAMEWORK_NAMESPACE + "-dp-wrapper2"]: {
        "pointer": {
          "refPath": "sandbox -> bridge-kebab-case2 -> wrapper2 -> pointer",
          "refType": "wrapper2",
          "refName": "namespace-dp-wrapper2",
          "default": true
        }
      }
    },
    "connector1": {
      [FRAMEWORK_NAMESPACE + "-dp-wrapper2"]: {
        "bean": {
          "refPath": "sandbox -> connector1 -> wrapper2 -> bean",
          "refType": "wrapper2",
          "refName": "namespace-dp-wrapper2",
          "default": true
        }
      }
    },
    "connector2": {
      [FRAMEWORK_NAMESPACE + "DpWrapper2"]: {
        "bean": {
          "refPath": "sandbox -> connector2 -> wrapper2 -> bean",
          "refType": "wrapper2",
          "refName": "namespace-dp-wrapper2",
          "default": true
        }
      }
    }
  }
};

if (!lab.isUpgradeSupported("bridge-full-ref")) {
  module.exports.bridges = {};
};
