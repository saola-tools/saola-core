'use strict';

var lab = require('../../../index');

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
      "port": 17741,
      transformRequest: function(req) {
        return req && req.body || {};
      }
    },
    "wrapper2": {
      "port": 17742,
      transformRequest: function(req) {
        return req && req.body || {};
      }
    }
  }
}

if (!lab.isFeatureSupported('bridge-full-ref')) {
  module.exports.bridges = {}
};
