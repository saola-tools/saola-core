"use strict";

const lab = require("../../../index");

const constx = require(lab.getFrameworkModule("utils/constx"));
const FRAMEWORK_NAMESPACE = constx.FRAMEWORK.NAMESPACE;

module.exports = {
  plugins: {
    wrapper1: {
      host: "localhost",
      port: 17731
    }
  },
  bridges: {
    "bridgeKebabCase1": {
      [FRAMEWORK_NAMESPACE + "-dp-wrapper1"]: {
        "pointer": {
          "refPath": "sandbox -> bridge-kebab-case1 -> wrapper1 -> pointer",
          "refType": "wrapper1",
          "refName": "namespace-dp-wrapper1",
          "default": true
        }
      }
    },
    "bridgeKebabCase2": {
      [FRAMEWORK_NAMESPACE + "-dp-wrapper1"]: {
        "pointer": {
          "refPath": "sandbox -> bridge-kebab-case2 -> wrapper1 -> pointer",
          "refType": "wrapper1",
          "refName": "namespace-dp-wrapper1",
          "default": true
        }
      }
    },
    "connector1": {
      [FRAMEWORK_NAMESPACE + "DpWrapper1"]: {
        "bean": {
          "refPath": "sandbox -> connector1 -> wrapper1 -> bean",
          "refType": "wrapper1",
          "refName": "namespace-dp-wrapper1",
          "default": true
        }
      }
    },
    "connector2": {
      [FRAMEWORK_NAMESPACE + "-dp-wrapper1"]: {
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
