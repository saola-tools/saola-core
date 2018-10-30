'use strict';

var lab = require('../index');
var Devebot = lab.getDevebot();
var lodash = Devebot.require('lodash');
var chores = Devebot.require('chores');
var debugx = Devebot.require('pinbug')('tdd:devebot:core:bridge-loader');
var assert = require('chai').assert;
var util = require('util');
var LogConfig = require('logolite').LogConfig;
var LogTracer = require('logolite').LogTracer;
var envmask = require('envmask').instance;

describe('tdd:devebot:core:bridge-loader', function() {
  this.timeout(lab.getDefaultTimeout());

  var issueInspector = lab.getIssueInspector();

  before(function() {
    envmask.setup({
      LOGOLITE_ALWAYS_ENABLED: 'all',
      LOGOLITE_ALWAYS_MUTED: 'all'
    });
    LogConfig.reset();
  });

  describe('loadMetadata()', function() {
    it("load bridge's metadata from empty application", function() {
      var bridgeLoader = lab.createBridgeLoader();
      var metadataMap = {};
      bridgeLoader.loadMetadata(metadataMap);
      false && console.log('metadataMap: %s', JSON.stringify(metadataMap, null, 2));
      assert.deepEqual(metadataMap, {});
    });
    it("load bridge's metadata from simplest application", function() {
      var bridgeLoader = lab.createBridgeLoader('simple');
      var metadataMap = {};
      bridgeLoader.loadMetadata(metadataMap);
      false && console.log('metadataMap: ', JSON.stringify(metadataMap, null, 2));
      assert.deepEqual(metadataMap, {});
    });
    it("load all of valid bridge's metadata from complete application", function() {
      var bridgeLoader = lab.createBridgeLoader('fullapp');
      var metadataMap = {};
      bridgeLoader.loadMetadata(metadataMap);
      issueInspector.barrier({exitOnError: true});
      false && console.log('metadataMap: %s', JSON.stringify(metadataMap, null, 2));
      assert.deepInclude(metadataMap, {
        "bridge1": {
          "name": "bridge1",
          "metadata": null
        },
        "bridge2": {
          "name": "bridge2",
          "metadata": null
        },
        "bridge3": {
          "name": "bridge3",
          "metadata": null
        },
        "bridge4": {
          "name": "bridge4",
          "metadata": null
        },
        "connector1": {
          "name": "devebot-co-connector1",
          "metadata": {
            "schema": {
              "type": "object",
              "properties": {
                "refPath": {
                  "type": "string"
                },
                "refType": {
                  "type": "string"
                },
                "refName": {
                  "type": "string"
                }
              },
              "required": ["refName", "refType"]
            }
          }
        },
        "connector2": {
          "name": "devebot-co-connector2",
          "metadata": {
            "schema": {
              "type": "object",
              "properties": {
                "refPath": {
                  "type": "string"
                },
                "refType": {
                  "type": "string"
                },
                "refName": {
                  "type": "string"
                }
              },
              "required": ["refName", "refType"]
            }
          }
        }
      });
    });
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
      issueInspector.barrier({exitOnError: true});
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
        },
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
      };

      if (!chores.isUpgradeSupported('bridge-full-ref'))
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
      issueInspector.barrier({exitOnError: true});
      false && console.log('dialectMap: ', util.inspect(originMap, { depth: 5 }));
      var dialectMap = lodash.mapValues(originMap, function(dialect) {
        return lodash.assign(lodash.pick(dialect, [
            'construktor.argumentProperties',
            'construktor.argumentSchema'
          ]), lodash.omit(dialect, ['construktor']));
      });
      false && console.log('dialectMap: ', JSON.stringify(dialectMap, null, 2));
      // uniqueName = [pluginName, bridgeName, dialectName].join(chores.getSeparator());
      var expectedMap = {};
      expectedMap[chores.toFullname("application", "bridge1", "anyname1z")] = {
        "construktor": {
          "argumentSchema": {
            "$id": chores.toFullname("application", "bridge1", "anyname1z"),
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
        "name": "bridge1#anyname1z"
      };
      expectedMap[chores.toFullname("plugin1", "bridge1", "anyname1a")] = {
        "construktor": {
          "argumentSchema": {
            "$id": chores.toFullname("plugin1", "bridge1", "anyname1a"),
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
        "name": "bridge1#anyname1a"
      };
      expectedMap[chores.toFullname("plugin2", "bridge1", "anyname1b")] = {
        "construktor": {
          "argumentSchema": {
            "$id": chores.toFullname("plugin2", "bridge1", "anyname1b"),
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
        "name": "bridge1#anyname1b"
      };
      expectedMap[chores.toFullname("plugin1", "bridge2", "anyname2a")] = {
        "construktor": {
          "argumentSchema": {
            "$id": chores.toFullname("plugin1", "bridge2", "anyname2a"),
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
        "name": "bridge2#anyname2a"
      };
      expectedMap[chores.toFullname("plugin1", "bridge2", "anyname2c")] = {
        "construktor": {
          "argumentSchema": {
            "$id": chores.toFullname("plugin1", "bridge2", "anyname2c"),
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
        "name": "bridge2#anyname2c"
      };
      expectedMap[chores.toFullname("plugin1", "bridge3", "anyname3a")] = {
        "construktor": {
          "argumentSchema": {
            "$id": chores.toFullname("plugin1", "bridge3", "anyname3a"),
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
        "name": "bridge3#anyname3a"
      };
      expectedMap[chores.toFullname("application", "devebot-co-connector1", "wrapper")] = {
        "construktor": {
          "argumentSchema": {
            "$id": chores.toFullname("application", "devebot-co-connector1", "wrapper"),
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
        "name": "connector1#wrapper"
      };
      expectedMap[chores.toFullname("application", "devebot-co-connector2", "wrapper")] = {
        "construktor": {
          "argumentSchema": {
            "$id": chores.toFullname("application", "devebot-co-connector2", "wrapper"),
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
        "name": "connector2#wrapper"
      };

      if (!chores.isUpgradeSupported('bridge-full-ref')) {
        expectedMap = {};
        expectedMap[chores.toFullname("bridge1", "anyname1a")] = {
          "construktor": {
            "argumentSchema": {
              "$id": chores.toFullname("bridge1", "anyname1a"),
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
        };
        expectedMap[chores.toFullname("bridge1", "anyname1b")] = {
          "construktor": {
            "argumentSchema": {
              "$id": chores.toFullname("bridge1", "anyname1b"),
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
        };
        expectedMap[chores.toFullname("bridge2", "anyname2a")] = {
          "construktor": {
            "argumentSchema": {
              "$id": chores.toFullname("bridge2", "anyname2a"),
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
        };
        expectedMap[chores.toFullname("bridge3", "anyname3a")] = {
          "construktor": {
            "argumentSchema": {
              "$id": chores.toFullname("bridge3", "anyname3a"),
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
        };
      }
      assert.sameMembers(lodash.keys(dialectMap), lodash.keys(expectedMap));
      assert.deepInclude(dialectMap, expectedMap);
    });
  });

  after(function() {
    LogTracer.clearStringifyInterceptors();
    envmask.reset();
  });
});
