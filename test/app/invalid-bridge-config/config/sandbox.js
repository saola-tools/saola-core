'use strict';

var lab = require('../../../index');
var Devebot = lab.getDevebot();
var chores = Devebot.require('chores');

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
}

if (chores.isOldFeatures()) {
  module.exports.bridges = {
    "invalidInstance": {
      "bridgeInvalidConfig": {
        "host": 17779,
        "port": "0.0.0.0"
      }
    }
  }
};
