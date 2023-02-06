"use strict";

const lab = require("../index");
const Devebot = lab.getFramework();
const chores = Devebot.require("chores");
const lodash = Devebot.require("lodash");
const assert = require("chai").assert;
const LogConfig = Devebot.require("logolite").LogConfig;
const LogTracer = Devebot.require("logolite").LogTracer;
const Envcloak = require("envcloak");
const envcloak = Envcloak.instance;

const constx = require(lab.getFrameworkModule("utils/constx"));
const FRAMEWORK_PACKAGE_NAME = constx.FRAMEWORK.PACKAGE_NAME;

const ManifestHandler = lab.acquireFrameworkModule("backbone/manifest-handler");
const SELECTED_FIELDS = ManifestHandler.__get__("SELECTED_FIELDS");

describe("tdd:lib:base:kernel", function() {
  this.timeout(lab.getDefaultTimeout());

  let stepEnv = new Envcloak();
  let issueInspector = lab.getIssueInspector();

  before(function() {
    envcloak.setup({
      LOGOLITE_FULL_LOG_MODE: "false",
      LOGOLITE_ALWAYS_ENABLED: "all",
      LOGOLITE_ALWAYS_MUTED: "all",
      DEVEBOT_FORCING_SILENT: "issue-inspector",
      DEVEBOT_NODE_ENV: "test",
    });
    LogConfig.reset();
    issueInspector.reset();
    chores.clearCache();
  });

  describe("extractBundleSchema()", function() {
    let Kernel = lab.acquireFrameworkModule("kernel");
    let extractBundleSchema = Kernel.__get__("extractBundleSchema");

    beforeEach(function() {
      stepEnv.reset();
      chores.clearCache();
    });

    after(function() {
      stepEnv.reset();
      chores.clearCache();
    });

    it("should extract plugin metadata and enrich with dependencies (empty dependencies)", function() {
      if (!chores.isUpgradeSupported("metadata-refiner") || chores.isUpgradeSupported("manifest-refiner")) {
        this.skip();
      }
      let bundleMetadata = {
        "devebot-dp-wrapper1/sandbox": {
          "default": {
            "crateScope": "devebot-dp-wrapper1",
            "pluginCode": "wrapper1",
            "type": "sandbox",
            "subtype": "default",
            "schema": {
              "type": "object",
              "properties": {
                "host": {
                  "type": "string"
                },
                "port": {
                  "type": "number"
                }
              }
            }
          }
        },
        "devebot-dp-wrapper2/sandbox": {
          "default": {
            "crateScope": "devebot-dp-wrapper2",
            "pluginCode": "wrapper2",
            "type": "sandbox",
            "subtype": "default",
            "schema": {
              "type": "object",
              "properties": {
                "host": {
                  "type": "string"
                },
                "port": {
                  "type": "number"
                }
              }
            }
          }
        }
      };

      let bundleSchema = extractBundleSchema(SELECTED_FIELDS, bundleMetadata);
      false && console.info("bundleSchema: %s", JSON.stringify(bundleSchema, null, 2));
      assert.deepEqual(bundleSchema, {
        "profile": {},
        "sandbox": {
          "plugins": {
            "wrapper1": {
              "crateScope": "devebot-dp-wrapper1",
              "schema": {
                "type": "object",
                "properties": {
                  "host": {
                    "type": "string"
                  },
                  "port": {
                    "type": "number"
                  }
                }
              }
            },
            "wrapper2": {
              "crateScope": "devebot-dp-wrapper2",
              "schema": {
                "type": "object",
                "properties": {
                  "host": {
                    "type": "string"
                  },
                  "port": {
                    "type": "number"
                  }
                }
              }
            }
          }
        }
      });
    });

    it("should extract plugin metadata and enrich with dependencies (normal case)", function() {
      if (!chores.isUpgradeSupported("metadata-refiner") || chores.isUpgradeSupported("manifest-refiner")) {
        this.skip();
      }
      let bundleMetadata = {
        "application/sandbox": {
          "default": {
            "crateScope": "application",
            "pluginCode": "application",
            "type": "sandbox",
            "schema": {
              "type": "object",
              "properties": {
                "contextPath": {
                  "type": "string"
                }
              }
            }
          }
        },
        "sub-plugin1/sandbox": {
          "default": {
            "crateScope": "sub-plugin1",
            "pluginCode": "subPlugin1",
            "type": "sandbox",
            "subtype": "default",
            "schema": {
              "type": "object",
              "properties": {
                "host": {
                  "type": "string"
                },
                "port": {
                  "type": "number"
                }
              }
            }
          }
        },
        "sub-plugin2/sandbox": {
          "default": {
            "crateScope": "sub-plugin2",
            "pluginCode": "subPlugin2",
            "type": "sandbox",
            "subtype": "default",
            "schema": {
              "type": "object",
              "properties": {
                "host": {
                  "type": "string"
                },
                "port": {
                  "type": "number"
                }
              }
            }
          }
        },
        "plugin1/sandbox": {
          "default": {
            "crateScope": "plugin1",
            "pluginCode": "plugin1",
            "type": "sandbox",
            "schema": {}
          }
        },
        "plugin2/sandbox": {
          "default": {
            "crateScope": "plugin2",
            "pluginCode": "plugin2",
            "type": "sandbox",
            "schema": {}
          }
        },
        "plugin3/sandbox": {
          "default": {
            "crateScope": "plugin3",
            "pluginCode": "plugin3",
            "type": "sandbox",
            "schema": {}
          }
        }
      };
      let expectedBundleSchema = {
        "profile": {},
        "sandbox": {
          "application": {
            "crateScope": "application",
            "schema": {
              "type": "object",
              "properties": {
                "contextPath": {
                  "type": "string"
                }
              }
            }
          },
          "plugins": {
            "subPlugin1": {
              "crateScope": "sub-plugin1",
              "schema": {
                "type": "object",
                "properties": {
                  "host": {
                    "type": "string"
                  },
                  "port": {
                    "type": "number"
                  }
                }
              },
            },
            "subPlugin2": {
              "crateScope": "sub-plugin2",
              "schema": {
                "type": "object",
                "properties": {
                  "host": {
                    "type": "string"
                  },
                  "port": {
                    "type": "number"
                  }
                }
              },
            },
            "plugin1": {
              "crateScope": "plugin1",
              "schema": {},
            },
            "plugin2": {
              "crateScope": "plugin2",
              "schema": {},
            },
            "plugin3": {
              "crateScope": "plugin3",
              "schema": {},
            }
          }
        }
      };
      let bundleSchema = extractBundleSchema(SELECTED_FIELDS, bundleMetadata);
      false && console.info("bundleSchema: %s", JSON.stringify(bundleSchema, null, 2));
      assert.deepEqual(bundleSchema, expectedBundleSchema);
    });
  });

  describe("extractBridgeSchema()", function() {
    let Kernel = lab.acquireFrameworkModule("kernel");
    let extractBridgeSchema = Kernel.__get__("extractBridgeSchema");

    let expectedSchema = {
      "bridge1": {},
      "bridge2": {},
      "bridge3": {},
      "bridge4": {},
      "connector1": {
        "schema": {
          "type": "object",
          "properties": {
            "host": {
              "type": "string"
            },
            "port": {
              "type": "number"
            },
            "verbose": {
              "type": "boolean"
            }
          },
          "required": [ "host", "port" ]
        }
      },
      "connector2": {
        "schema": {
          "type": "object",
          "properties": {
            "params": {
              "type": "object"
            },
            "handler": {}
          },
          "required": [ "params" ]
        }
      }
    };

    beforeEach(function() {
      stepEnv.reset();
      chores.clearCache();
    });

    after(function() {
      stepEnv.reset();
      chores.clearCache();
    });

    it("should extract plugin schema from bridge metadata properly", function() {
      if (!chores.isUpgradeSupported("metadata-refiner") || chores.isUpgradeSupported("manifest-refiner")) {
        this.skip();
      }
      let bridgeMetadata = {
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
          "name": "devebot-co-connector1",
          "schema": {
            "type": "object",
            "properties": {
              "host": {
                "type": "string"
              },
              "port": {
                "type": "number"
              },
              "verbose": {
                "type": "boolean"
              }
            },
            "required": [ "host", "port" ]
          }
        },
        "connector2": {
          "name": "devebot-co-connector2",
          "schema": {
            "type": "object",
            "properties": {
              "params": {
                "type": "object"
              },
              "handler": {}
            },
            "required": [ "params" ]
          }
        },
      };

      let bridgeSchema = extractBridgeSchema(SELECTED_FIELDS, bridgeMetadata);

      false && console.info("bridgeSchema: %s", JSON.stringify(bridgeSchema, null, 2));
      assert.deepEqual(bridgeSchema, expectedSchema);
    });
  });

  describe("validate config/schemas", function() {
    before(function() {
      if (chores.isUpgradeSupported("manifest-refiner")) return this.skip();
      if (!chores.isUpgradeSupported("metadata-refiner")) return this.skip();
    });

    let loggingStore = {};

    before(function() {
      LogTracer.setupDefaultInterceptors([{
        accumulator: loggingStore,
        mappings: [{
          allTags: [ chores.toFullname(FRAMEWORK_PACKAGE_NAME, "manifestHandler"), "bridge-config-schema-input" ],
          storeTo: "bridgeInput"
        }, {
          allTags: [ chores.toFullname(FRAMEWORK_PACKAGE_NAME, "manifestHandler"), "plugin-config-schema-input" ],
          storeTo: "pluginInput"
        }, {
          allTags: [ chores.toFullname(FRAMEWORK_PACKAGE_NAME, "manifestHandler"), "validate-bridge-config-by-schema" ],
          storeTo: "bridgeData"
        }, {
          allTags: [ chores.toFullname(FRAMEWORK_PACKAGE_NAME, "manifestHandler"), "validate-bundle-config-by-schema" ],
          storeTo: "pluginData"
        }, {
          allTags: [ chores.toFullname(FRAMEWORK_PACKAGE_NAME, "manifestHandler"), "validating-config-by-schema-result" ],
          storeTo: "outputValidation"
        }, {
          allTags: [ chores.toFullname(FRAMEWORK_PACKAGE_NAME, "issueInspector"), "examine", "metadata-validating" ],
          matchingField: "invoker",
          matchingRule: chores.toFullname(FRAMEWORK_PACKAGE_NAME, "kernel"),
          storeTo: "errorSummary"
        }]
      }]);
    });

    beforeEach(function() {
      LogTracer.reset().empty(loggingStore);
      issueInspector.reset();
    });

    after(function() {
      stepEnv.reset();
      chores.clearCache();
    });

    it("kernel constructor is ok if no error has occurred in validating", function() {
      let unhook = lab.preventExit();

      let kernel = lab.createKernel("fullapp");

      let bundleMetadata = lodash.get(loggingStore, "pluginInput.0.metadata", {});
      false && console.info("bundleMetadata: %s", JSON.stringify(bundleMetadata, null, 2));

      let bridgeConfig = lodash.get(loggingStore, "bridgeData.0.bridgeConfig", {});
      let bridgeSchema = lodash.get(loggingStore, "bridgeData.0.bridgeSchema", {});
      false && console.info("bridgeConfig: %s", JSON.stringify(bridgeConfig, null, 2));
      false && console.info("bridgeSchema: %s", JSON.stringify(bridgeSchema, null, 2));

      let bundleConfig = lodash.get(loggingStore, "pluginData.0.bundleConfig", {});
      let bundleSchema = lodash.get(loggingStore, "pluginData.0.bundleSchema", {});
      false && console.info("bundleConfig: %s", JSON.stringify(bundleConfig, null, 2));
      false && console.info("bundleSchema: %s", JSON.stringify(bundleSchema, null, 2));

      let result = lodash.get(loggingStore, "outputValidation.0.result", []);
      false && lodash.forEach(result, function(item) {
        console.log("- validation result: %s", JSON.stringify(lodash.omit(item, ["stack"])));
        if (item.hasError) {
          console.log("  - stack:\n%s", item.stack);
        }
      });

      let expectedBridges = {
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
            "wrapper": {
              "refName": "fullapp",
              "refPath": "sandbox -> connector1 -> application -> wrapper",
              "refType": "application"
            }
          }
        },
        "connector2": {
          "application": {
            "wrapper": {
              "refName": "fullapp",
              "refPath": "sandbox -> connector2 -> application -> wrapper",
              "refType": "application"
            }
          }
        }
      };

      if (!chores.isUpgradeSupported("bridge-full-ref")) {
        expectedBridges = {
          "anyname1a": {
            "bridge1": {
              "refPath": "sandbox -> bridge1 -> anyname1a",
              "refType": "plugin",
              "refName": "plugin1"
            }
          },
          "anyname2a": {
            "bridge2": {
              "refPath": "sandbox -> bridge2 -> anyname2a",
              "refType": "plugin",
              "refName": "plugin1"
            }
          },
          "anyname2c": {
            "bridge2": {
              "refPath": "sandbox -> bridge2 -> anyname2c",
              "refType": "plugin",
              "refName": "plugin1"
            }
          },
          "anyname1b": {
            "bridge1": {
              "refPath": "sandbox -> bridge1 -> anyname1b",
              "refType": "plugin",
              "refName": "plugin2"
            }
          },
          "anyname1c": {
            "bridge1": {
              "refPath": "sandbox -> bridge1 -> anyname1c",
              "refType": "plugin",
              "refName": "plugin2"
            }
          },
          "anyname2b": {
            "bridge2": {
              "refPath": "sandbox -> bridge2 -> anyname2b",
              "refType": "plugin",
              "refName": "plugin2"
            }
          }
        };
      }

      assert.deepInclude(bridgeConfig, expectedBridges);

      assert.deepInclude(bundleConfig.sandbox, {
        "application": {
          "host": "0.0.0.0",
          "port": 17700,
          "verbose": false
        },
        "plugins": {
          "plugin1": {
            "host": "0.0.0.0",
            "port": 17701,
            "verbose": false,
            "tdd": {
              "field1": "String 1",
              "field2": 10001,
              "field3": {
                "foo": "foo",
                "bar": "bar",
                "num": 1001
              },
              "field4": [ 1, 2, 3, null, "4" ]
            }
          },
          "plugin2": {
            "host": "0.0.0.0",
            "port": 17702,
            "verbose": false,
            "tdd": {
              "field1": "String 2",
              "field2": 10002,
              "field3": {
                "foo": "foo",
                "bar": "bar",
                "num": 1002
              },
              "field4": [ 1, 2, 3, null, "4" ]
            }
          },
          "subPlugin1": {
            "host": "localhost",
            "port": 17721
          },
          "subPlugin2": {
            "host": "localhost",
            "port": 17722
          },
          "plugin3": {
            "host": "localhost",
            "port": 17703
          }
        }
      });

      let expectedBundleSchemaSandbox = {
        "application": {
          "crateScope": "application",
          "schema": {
            "type": "object",
            "properties": {
              "host": {
                "type": "string"
              },
              "port": {
                "type": "number"
              },
              "verbose": {
                "type": "boolean"
              }
            },
            "required": [ "host", "port" ]
          }
        },
        "plugins": {
          "plugin1": {
            "bridgeDepends": [ "bridge1", "bridge2" ],
            "pluginDepends": []
          },
          "plugin2": {
            "bridgeDepends": [ "bridge1", "bridge2" ],
            "pluginDepends": []
          },
          "plugin3": {
            "bridgeDepends": [],
            "pluginDepends": []
          },
          "subPlugin1": {
            "crateScope": "sub-plugin1",
            "bridgeDepends": [ "bridge1", "bridge2" ],
            "pluginDepends": [ "plugin1", "plugin2" ],
            "schema": {
              "type": "object",
              "properties": {
                "host": {
                  "type": "string"
                },
                "port": {
                  "type": "number"
                }
              }
            }
          },
          "subPlugin2": {
            "crateScope": "sub-plugin2",
            "bridgeDepends": [ "bridge2", "bridge3" ],
            "pluginDepends": [ "plugin2", "plugin3" ],
            "schema": {
              "type": "object",
              "properties": {
                "host": {
                  "type": "string"
                },
                "port": {
                  "type": "number"
                }
              }
            }
          }
        }
      };
      if (!chores.isUpgradeSupported("presets")) {
        lodash.forEach(lodash.keys(expectedBundleSchemaSandbox.plugins), function(pluginName) {
          let plugin = lodash.omit(expectedBundleSchemaSandbox.plugins[pluginName], ["bridgeDepends", "pluginDepends"]);
          if (lodash.isEmpty(plugin)) {
            delete expectedBundleSchemaSandbox.plugins[pluginName];
          } else {
            expectedBundleSchemaSandbox.plugins[pluginName] = plugin;
          }
        });
      }
      assert.deepInclude(bundleSchema.sandbox, expectedBundleSchemaSandbox);

      // errorSummary.0 <= configLoader, errorSummary.1 <= kernel
      if (true) {
        assert.lengthOf(lodash.get(loggingStore, "errorSummary", []), 1);
        let errorSummary = lodash.pick(lodash.get(loggingStore, "errorSummary.0", {}), [
          "totalOfErrors", "errors"
        ]);
        assert.deepEqual(errorSummary, { totalOfErrors: 0, errors: [] });
      } else {
        console.log("errorSummary: %s", JSON.stringify(loggingStore.errorSummary, null, 2));
      }

      let totalOfExit = unhook();
      assert.equal(totalOfExit, 0);
    });

    it("loading an invalid bridge's configure make program exit", function() {
      let unhook = lab.preventExit();
      let kernel = lab.createKernel("invalid-bridge-config");

      // errorSummary.0 <= kernel
      if (true) {
        assert.lengthOf(lodash.get(loggingStore, "errorSummary", []), 1);
        let errorSummary = lodash.pick(lodash.get(loggingStore, "errorSummary.0", {}), [
          "totalOfErrors", "errors"
        ]);
        assert.equal(errorSummary.totalOfErrors, 1);
        assert.lengthOf(errorSummary.errors, 1);
      } else {
        console.log("errorSummary: %s", JSON.stringify(loggingStore.errorSummary, null, 2));
      }

      let totalOfExit = unhook();
      assert.equal(totalOfExit, 2);
    });

    it("loading an invalid bridge's configure but skipping validation", function() {
      if (!chores.isUpgradeSupported("presets")) this.skip();
      let unhook = lab.preventExit();
      let kernel = lab.createKernel("invalid-bridge-config-but-skip");

      // errorSummary.0 <= kernel
      if (true) {
        assert.lengthOf(lodash.get(loggingStore, "errorSummary", []), 1);
        let errorSummary = lodash.pick(lodash.get(loggingStore, "errorSummary.0", {}), [
          "totalOfErrors", "errors"
        ]);
        assert.equal(errorSummary.totalOfErrors, 0);
        assert.lengthOf(errorSummary.errors, 0);
      } else {
        console.log("errorSummary: %s", JSON.stringify(loggingStore.errorSummary, null, 2));
      }

      let totalOfExit = unhook();
      assert.equal(totalOfExit, 0);
    });

    it("loading an invalid plugin's configure make program exit", function() {
      let unhook = lab.preventExit();
      let kernel = lab.createKernel("invalid-plugin-config");

      // errorSummary.0 <= kernel
      if (true) {
        assert.lengthOf(lodash.get(loggingStore, "errorSummary", []), 1);
        let errorSummary = lodash.pick(lodash.get(loggingStore, "errorSummary.0", {}), [
          "totalOfErrors", "errors"
        ]);
        assert.equal(errorSummary.totalOfErrors, 2);
        assert.lengthOf(errorSummary.errors, 2);
      } else {
        console.log("errorSummary: %s", JSON.stringify(loggingStore.errorSummary, null, 2));
      }

      let totalOfExit = unhook();
      assert.equal(totalOfExit, 2);
    });

    it("loading an invalid plugin's configure but skipping validation", function() {
      if (!chores.isUpgradeSupported("presets")) return this.skip();
      let unhook = lab.preventExit();
      let kernel = lab.createKernel("invalid-plugin-config-but-skip");

      // errorSummary.0 <= kernel
      if (true) {
        assert.lengthOf(lodash.get(loggingStore, "errorSummary", []), 1);
        let errorSummary = lodash.pick(lodash.get(loggingStore, "errorSummary.0", {}), [
          "totalOfErrors", "errors"
        ]);
        assert.equal(errorSummary.totalOfErrors, 0);
        assert.lengthOf(errorSummary.errors, 0);
      } else {
        console.log("errorSummary: %s", JSON.stringify(loggingStore.errorSummary, null, 2));
      }

      let totalOfExit = unhook();
      assert.equal(totalOfExit, 0);
    });

    after(function() {
      LogTracer.clearInterceptors();
      issueInspector.reset();
    });
  });

  after(function() {
    envcloak.reset();
  });
});
