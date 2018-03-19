'use strict';

var lab = require('../index');
var Devebot = lab.getDevebot();
var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');
var chores = Devebot.require('chores');
var debugx = Devebot.require('pinbug')('tdd:devebot:core:bridge-loader');
var assert = require('chai').assert;
var expect = require('chai').expect;
var path = require('path');
var util = require('util');
var Injektor = require('injektor');
var LogConfig = require('logolite').LogConfig;
var LogTracer = require('logolite').LogTracer;
var envtool = require('logolite/envtool');
var rewire = require('rewire');
var errorHandlerPath = path.join(lab.getDevebotHome(), 'lib/backbone/error-handler');
var errorHandler = require(errorHandlerPath).instance;

describe('tdd:devebot:core:bridge-loader', function() {
  this.timeout(lab.getDefaultTimeout());
  
  before(function() {
    envtool.setup({
      LOGOLITE_ALWAYS_ENABLED: 'all',
      LOGOLITE_ALWAYS_MUTED: 'all'
    });
    LogConfig.reset();
  });

  describe('loadSchemas()', function() {
    it('load schemas from empty application');
    it('load schemas from simplest application');
    it('load all of valid schemas from complete application');
  });

  describe('loadDialects()', function() {
    it('load dialects from empty application', function() {
      var bridgeLoader = lab.createBridgeLoader();
      var dialectMap = {};
      bridgeLoader.loadDialects(dialectMap);
      false && console.log('dialectMap: ', JSON.stringify(dialectMap, null, 2));
      assert.deepEqual(dialectMap, {});
    });

    it('load dialects from simplest application', function() {
      var bridgeLoader = lab.createBridgeLoader('simple');
      var dialectMap = {};
      bridgeLoader.loadDialects(dialectMap);
      false && console.log('dialectMap: ', JSON.stringify(dialectMap, null, 2));
      assert.deepEqual(dialectMap, {});
    });

    it('load nothing from all of components if dialectOptions is omitted', function() {
      var bridgeLoader = lab.createBridgeLoader('fullapp');
      var originMap = {};
      bridgeLoader.loadDialects(originMap); // dialectOptions is omitted
      errorHandler.barrier({exitOnError: true});
      false && console.log('dialectMap: ', util.inspect(originMap, { depth: 5 }));
      var dialectMap = lodash.mapValues(originMap, function(dialect) {
        return lodash.assign(lodash.pick(dialect, [
            'construktor.argumentProperties',
            'construktor.argumentSchema'
          ]), lodash.omit(dialect, ['construktor']));
      });
      false && console.log('dialectMap: ', JSON.stringify(dialectMap, null, 2));
      assert.deepInclude(dialectMap, {});
    });

    it('load all of valid dialects from all of components', function() {
      var bridgeLoader = lab.createBridgeLoader('fullapp');
      var bridgeConfig = {
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
            }
          }
        },
        "bridge2": {
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
          }
        },
        "bridge3": {
          "plugin1": {
            "anyname3a": {
              "refPath": "sandbox -> bridge3 -> plugin1 -> anyname3a",
              "refType": "application",
              "refName": "fullapp"
            }
          }
        }
      };

      if (chores.isOldFeatures())
      bridgeConfig = {
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
        "anyname3a": {
          "bridge3": {
            "refPath": "sandbox -> bridge3 -> anyname3a"
          }
        }
      };
      var originMap = {};
      bridgeLoader.loadDialects(originMap, bridgeConfig);
      errorHandler.barrier({exitOnError: true});
      false && console.log('dialectMap: ', util.inspect(originMap, { depth: 5 }));
      var dialectMap = lodash.mapValues(originMap, function(dialect) {
        return lodash.assign(lodash.pick(dialect, [
            'construktor.argumentProperties',
            'construktor.argumentSchema'
          ]), lodash.omit(dialect, ['construktor']));
      });
      false && console.log('dialectMap: ', JSON.stringify(dialectMap, null, 2));
      var expectedMap = {
        "application/bridge1/anyname1z": {
          "construktor": {
            "argumentSchema": {
              "$id": "anyname1z",
              "type": "object",
              "properties": {
                "sandboxName": {
                  "type": "string"
                },
                "sandboxConfig": {
                  "type": "object"
                },
                "profileName": {
                  "type": "string"
                },
                "profileConfig": {
                  "type": "object"
                },
                "loggingFactory": {
                  "type": "object"
                }
              }
            }
          },
          "crateScope": "application",
          "name": "bridge1#anyname1z",
          "pluginName": "application"
        },
        "plugin1/bridge1/anyname1a": {
          "construktor": {
            "argumentSchema": {
              "$id": "anyname1a",
              "type": "object",
              "properties": {
                "sandboxName": {
                  "type": "string"
                },
                "sandboxConfig": {
                  "type": "object"
                },
                "profileName": {
                  "type": "string"
                },
                "profileConfig": {
                  "type": "object"
                },
                "loggingFactory": {
                  "type": "object"
                }
              }
            }
          },
          "crateScope": "plugin1",
          "name": "bridge1#anyname1a",
          "pluginName": "plugin1"
        },
        "plugin2/bridge1/anyname1b": {
          "construktor": {
            "argumentSchema": {
              "$id": "anyname1b",
              "type": "object",
              "properties": {
                "sandboxName": {
                  "type": "string"
                },
                "sandboxConfig": {
                  "type": "object"
                },
                "profileName": {
                  "type": "string"
                },
                "profileConfig": {
                  "type": "object"
                },
                "loggingFactory": {
                  "type": "object"
                }
              }
            }
          },
          "crateScope": "plugin2",
          "name": "bridge1#anyname1b",
          "pluginName": "plugin2"
        },
        "plugin1/bridge2/anyname2a": {
          "construktor": {
            "argumentSchema": {
              "$id": "anyname2a",
              "type": "object",
              "properties": {
                "sandboxName": {
                  "type": "string"
                },
                "sandboxConfig": {
                  "type": "object"
                },
                "profileName": {
                  "type": "string"
                },
                "profileConfig": {
                  "type": "object"
                },
                "loggingFactory": {
                  "type": "object"
                }
              }
            }
          },
          "crateScope": "plugin1",
          "name": "bridge2#anyname2a",
          "pluginName": "plugin1"
        },
        "plugin1/bridge2/anyname2c": {
          "construktor": {
            "argumentSchema": {
              "$id": "anyname2c",
              "type": "object",
              "properties": {
                "sandboxName": {
                  "type": "string"
                },
                "sandboxConfig": {
                  "type": "object"
                },
                "profileName": {
                  "type": "string"
                },
                "profileConfig": {
                  "type": "object"
                },
                "loggingFactory": {
                  "type": "object"
                }
              }
            }
          },
          "crateScope": "plugin1",
          "name": "bridge2#anyname2c",
          "pluginName": "plugin1"
        },
        "plugin1/bridge3/anyname3a": {
          "construktor": {
            "argumentSchema": {
              "$id": "anyname3a",
              "type": "object",
              "properties": {
                "sandboxName": {
                  "type": "string"
                },
                "sandboxConfig": {
                  "type": "object"
                },
                "profileName": {
                  "type": "string"
                },
                "profileConfig": {
                  "type": "object"
                },
                "loggingFactory": {
                  "type": "object"
                }
              }
            }
          },
          "crateScope": "plugin1",
          "name": "bridge3#anyname3a",
          "pluginName": "plugin1"
        }
      };

      if (chores.isOldFeatures()) {
        expectedMap = {
          "bridge1/anyname1a": {
            "construktor": {
              "argumentSchema": {
                "$id": "anyname1a",
                "type": "object",
                "properties": {
                  "sandboxName": {
                    "type": "string"
                  },
                  "sandboxConfig": {
                    "type": "object"
                  },
                  "profileName": {
                    "type": "string"
                  },
                  "profileConfig": {
                    "type": "object"
                  },
                  "loggingFactory": {
                    "type": "object"
                  }
                }
              }
            },
            "crateScope": "bridge1",
            "name": "anyname1a"
          },
          "bridge1/anyname1b": {
            "construktor": {
              "argumentSchema": {
                "$id": "anyname1b",
                "type": "object",
                "properties": {
                  "sandboxName": {
                    "type": "string"
                  },
                  "sandboxConfig": {
                    "type": "object"
                  },
                  "profileName": {
                    "type": "string"
                  },
                  "profileConfig": {
                    "type": "object"
                  },
                  "loggingFactory": {
                    "type": "object"
                  }
                }
              }
            },
            "crateScope": "bridge1",
            "name": "anyname1b"
          },
          "bridge2/anyname2a": {
            "construktor": {
              "argumentSchema": {
                "$id": "anyname2a",
                "type": "object",
                "properties": {
                  "sandboxName": {
                    "type": "string"
                  },
                  "sandboxConfig": {
                    "type": "object"
                  },
                  "profileName": {
                    "type": "string"
                  },
                  "profileConfig": {
                    "type": "object"
                  },
                  "loggingFactory": {
                    "type": "object"
                  }
                }
              }
            },
            "crateScope": "bridge2",
            "name": "anyname2a"
          },
          "bridge3/anyname3a": {
            "construktor": {
              "argumentSchema": {
                "$id": "anyname3a",
                "type": "object",
                "properties": {
                  "sandboxName": {
                    "type": "string"
                  },
                  "sandboxConfig": {
                    "type": "object"
                  },
                  "profileName": {
                    "type": "string"
                  },
                  "profileConfig": {
                    "type": "object"
                  },
                  "loggingFactory": {
                    "type": "object"
                  }
                }
              }
            },
            "crateScope": "bridge3",
            "name": "anyname3a"
          }
        }
      }
      assert.sameMembers(lodash.keys(dialectMap), lodash.keys(expectedMap));
      assert.deepInclude(dialectMap, expectedMap);
    });
  });

  after(function() {
    LogTracer.clearStringifyInterceptors();
    envtool.reset();
  });
});
