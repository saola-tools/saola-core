'use strict';

var lab = require('../../../index');
var Devebot = lab.getDevebot();
var chores = Devebot.require('chores');

module.exports = {
  application: {
    "host": "0.0.0.0",
    "port": 17700,
    "verbose": false
  },
  bridges: {
    "bridge1": {
      "application": {
        "anyname1z": {
          "refPath": "sandbox -> bridge1 -> application -> anyname1z",
          "refType": "application",
          "refName": "fullapp"
        }
      },
      "plugin1": {
        "anyname1a": {
          "refPath": "sandbox -> bridge1 -> plugin1 -> anyname1a",
          "refType": "application",
          "refName": "fullapp"
        }
      },
      "plugin2": {
        "anyname1b": {
          "refPath": "sandbox -> bridge1 -> plugin2 -> anyname1b",
          "refType": "application",
          "refName": "fullapp"
        },
        "anyname1c": {
          "refPath": "sandbox -> bridge1 -> plugin2 -> anyname1c",
          "refType": "application",
          "refName": "fullapp"
        }
      }
    },
    "bridge2": {
      "application": {
        "anyname2y": {
          "refPath": "sandbox -> bridge2 -> application -> anyname2y",
          "refType": "application",
          "refName": "fullapp"
        },
        "anyname2z": {
          "refPath": "sandbox -> bridge2 -> application -> anyname2z",
          "refType": "application",
          "refName": "fullapp"
        }
      },
      "plugin1": {
        "anyname2a": {
          "refPath": "sandbox -> bridge2 -> plugin1 -> anyname2a",
          "refType": "application",
          "refName": "fullapp"
        },
        "anyname2c": {
          "refPath": "sandbox -> bridge2 -> plugin1 -> anyname2c",
          "refType": "application",
          "refName": "fullapp"
        }
      },
      "plugin2": {
        "anyname2b": {
          "refPath": "sandbox -> bridge2 -> plugin2 -> anyname2b",
          "refType": "application",
          "refName": "fullapp"
        }
      }
    },
    "connector1": {
      "application": {
        "connector1Wrapper1": {
          "refPath": "sandbox -> connector1 -> application -> connector1Wrapper1",
          "refType": "application",
          "refName": "fullapp"
        }
      }
    },
    "connector2": {
      "application": {
        "connector2Wrapper1": {
          "refPath": "sandbox -> connector2 -> application -> connector2Wrapper1",
          "refType": "application",
          "refName": "fullapp"
        }
      }
    }
  },
  plugins: {
    "plugin1": {
      "host": "0.0.0.0",
      "port": 17701,
      "verbose": false
    },
    "plugin2": {
      "host": "0.0.0.0",
      "port": 17702,
      "verbose": false
    }
  }
}

if (chores.isOldFeatures()) {
  module.exports.bridges = {
    "anyname1a": {
      "bridge1": {
        "refPath": "sandbox -> bridge1 -> anyname1a"
      }
    },
    "anyname1b": {
      "bridge1": {
        "refPath": "sandbox -> bridge1 -> anyname1b"
      }
    },
    "anyname2a": {
      "bridge2": {
        "refPath": "sandbox -> bridge2 -> anyname2a"
      }
    },
    "anyname2b": {
      "bridge2": {
        "refPath": "sandbox -> bridge2 -> anyname2b"
      }
    },
    "anyname2c": {
      "bridge2": {
        "refPath": "sandbox -> bridge2 -> anyname2c"
      }
    }
  }
};
