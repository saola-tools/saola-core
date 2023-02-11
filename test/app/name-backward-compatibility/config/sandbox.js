"use strict";

const lab = require("../../../index");

module.exports = {
  application: {
    "host": "0.0.0.0",
    "port": 17700,
    "verbose": true
  },
  bridges: {
    "bridgeKebabCase1": {
      "application": {
        "wrapper": {
          "refPath": "sandbox -> backward1 -> application -> wrapper",
          "refType": "application",
          "refName": "name-backward-compatibility"
        }
      }
    },
    "bridgeKebabCase2": {
      "application": {
        "wrapper": {
          "refPath": "sandbox -> backward2 -> application -> wrapper",
          "refType": "application",
          "refName": "name-backward-compatibility"
        }
      }
    },
    "connector1": {
      "application": {
        "wrapper": {
          "refPath": "sandbox -> connector1 -> application -> wrapper",
          "refType": "application",
          "refName": "name-backward-compatibility"
        }
      }
    },
    "connector2": {
      "application": {
        "wrapper": {
          "refPath": "sandbox -> connector2 -> application -> wrapper",
          "refType": "application",
          "refName": "name-backward-compatibility"
        }
      }
    }
  },
  plugins: {
    "plugin1": {
      "host": "0.0.0.0",
      "port": 17701,
      "verbose": true
    },
    "plugin2": {
      "host": "0.0.0.0",
      "port": 17702,
      "verbose": true
    }
  }
};
