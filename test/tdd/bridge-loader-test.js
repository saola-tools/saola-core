"use strict";

const lab = require("../index");
const FRWK = lab.getFramework();
const lodash = FRWK.require("lodash");
const chores = FRWK.require("chores");
const util = require("util");
const LogConfig = FRWK.require("logolite").LogConfig;
const LogTracer = FRWK.require("logolite").LogTracer;
const envcloak = require("envcloak").instance;

const { assert } = require("liberica");

const constx = require(lab.getFrameworkModule("utils/constx"));
const FRAMEWORK_NAMESPACE = constx.FRAMEWORK.NAMESPACE;

describe("tdd:lib:core:bridge-loader", function() {
  this.timeout(lab.getDefaultTimeout());

  let issueInspector = lab.getIssueInspector();

  before(function() {
    envcloak.setup({
      LOGOLITE_FULL_LOG_MODE: "false",
      LOGOLITE_ALWAYS_ENABLED: "all",
      LOGOLITE_ALWAYS_MUTED: "all"
    });
    LogConfig.reset();
    issueInspector.reset();
  });

  after(function() {
    LogTracer.clearInterceptors();
    envcloak.reset();
  });

  describe("loadMetadata()", function() {
    before(function() {
      if (!chores.isUpgradeSupported("metadata-refiner")) this.skip();
    });
    it("load bridge's metadata from empty application", function() {
      let bridgeLoader = lab.createBridgeLoader();
      let metadataMap = {};
      bridgeLoader.loadMetadata(metadataMap);
      false && console.info("metadataMap: %s", JSON.stringify(metadataMap, null, 2));
      assert.deepEqual(metadataMap, {});
    });
    it("load bridge's metadata from simplest application", function() {
      let bridgeLoader = lab.createBridgeLoader("simple");
      let metadataMap = {};
      bridgeLoader.loadMetadata(metadataMap);
      false && console.info("metadataMap: ", JSON.stringify(metadataMap, null, 2));
      assert.deepEqual(metadataMap, {});
    });
    it("load all of valid bridge's metadata from complete application", function() {
      let bridgeLoader = lab.createBridgeLoader("fullapp");
      let metadataMap = {};
      bridgeLoader.loadMetadata(metadataMap);
      issueInspector.barrier({exitOnError: true});
      false && console.info("metadataMap: %s", JSON.stringify(metadataMap, null, 2));
      assert.deepInclude(metadataMap, {
        "bridge1": {
          "name": "bridge1"
        },
        "bridge2": {
          "name": "bridge2"
        },
        "bridge3": {
          "name": "bridge3"
        },
        "bridge4": {
          "name": "bridge4"
        },
        "connector1": {
          "name": FRAMEWORK_NAMESPACE + "-co-connector1",
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
        },
        "connector2": {
          "name": FRAMEWORK_NAMESPACE + "-co-connector2",
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
      });
    });
  });

  describe("loadDialects()", function() {
    it("load dialects from empty application", function() {
      let bridgeLoader = lab.createBridgeLoader();
      let dialectMap = {};
      bridgeLoader.loadDialects(dialectMap);
      false && console.info("dialectMap: ", JSON.stringify(dialectMap, null, 2));
      assert.deepEqual(dialectMap, {});
    });

    it("load dialects from simplest application", function() {
      let bridgeLoader = lab.createBridgeLoader("simple");
      let dialectMap = {};
      bridgeLoader.loadDialects(dialectMap);
      false && console.info("dialectMap: ", JSON.stringify(dialectMap, null, 2));
      assert.deepEqual(dialectMap, {});
    });

    it("load nothing from all of components if dialectOptions is omitted", function() {
      let bridgeLoader = lab.createBridgeLoader("fullapp");
      let originMap = {};
      bridgeLoader.loadDialects(originMap); // dialectOptions is omitted
      issueInspector.barrier({exitOnError: true});
      false && console.info("dialectMap: ", util.inspect(originMap, { depth: 5 }));
      let dialectMap = lodash.mapValues(originMap, function(dialect) {
        return lodash.assign(lodash.pick(dialect, [
            "construktor.argumentProperties",
            "construktor.argumentSchema"
          ]), lodash.omit(dialect, ["construktor"]));
      });
      false && console.info("dialectMap: ", JSON.stringify(dialectMap, null, 2));
      assert.deepInclude(dialectMap, {});
    });

    it("load all of valid dialects from all of components", function() {
      let bridgeLoader = lab.createBridgeLoader("fullapp");
      let bridgeConfig = {
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

      if (!chores.isUpgradeSupported("bridge-full-ref")) {
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
}
      let originMap = {};
      bridgeLoader.loadDialects(originMap, bridgeConfig);
      issueInspector.barrier({exitOnError: true});
      false && console.info("dialectMap: ", util.inspect(originMap, { depth: 5 }));
      let dialectMap = lodash.mapValues(originMap, function(dialect) {
        return lodash.assign(lodash.pick(dialect, [
            "construktor.argumentProperties",
            "construktor.argumentSchema"
          ]), lodash.omit(dialect, ["construktor"]));
      });
      false && console.info("dialectMap: ", JSON.stringify(dialectMap, null, 2));
      // uniqueName = [pluginName, bridgeName, dialectName].join(chores.getSeparator());
      let expectedMap = {};
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
      expectedMap[chores.toFullname("application", FRAMEWORK_NAMESPACE + "-co-connector1", "wrapper")] = {
        "construktor": {
          "argumentSchema": {
            "$id": chores.toFullname("application", FRAMEWORK_NAMESPACE + "-co-connector1", "wrapper"),
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
      expectedMap[chores.toFullname("application", FRAMEWORK_NAMESPACE + "-co-connector2", "wrapper")] = {
        "construktor": {
          "argumentSchema": {
            "$id": chores.toFullname("application", FRAMEWORK_NAMESPACE + "-co-connector2", "wrapper"),
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

      if (!chores.isUpgradeSupported("bridge-full-ref")) {
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
});
