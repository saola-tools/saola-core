"use strict";

const lab = require("../index");
const Devebot = lab.getFramework();
const lodash = Devebot.require("lodash");
const chores = Devebot.require("chores");
const assert = require("chai").assert;
const util = require("util");
const LogConfig = Devebot.require("logolite").LogConfig;
const LogTracer = Devebot.require("logolite").LogTracer;
const envcloak = require("envcloak").instance;

const constx = require(lab.getFrameworkModule("utils/constx"));
const FRAMEWORK_PACKAGE_NAME = constx.FRAMEWORK.PACKAGE_NAME;

describe("tdd:lib:core:bundle-loader", function() {
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

  describe("loadRoutines()", function() {
    it("load routines from empty application", function() {
      let bundleLoader = lab.createBundleLoader();
      let routineMap = {};
      bundleLoader.loadRoutines(routineMap);
      false && console.info("routineMap: ", JSON.stringify(routineMap, null, 2));
      assert.deepEqual(routineMap, {});
    });
    it("load routines from simplest application", function() {
      let bundleLoader = lab.createBundleLoader("simple");
      let originMap = {};
      bundleLoader.loadRoutines(originMap);
      false && console.info("routineMap: ", JSON.stringify(originMap, null, 2));
      let routineMap = lab.simplifyRoutines(originMap);
      false && console.info("routineMap: ", JSON.stringify(routineMap, null, 2));
      let expectedMap = {};
      expectedMap[chores.toFullname(FRAMEWORK_PACKAGE_NAME, "applica-info")] = {
        "crateScope": FRAMEWORK_PACKAGE_NAME,
        "name": "applica-info",
        "object": {
          "info": {
            "alias": "app-info",
            "description": "[String]",
            "options": []
          },
          "handler": "[Function]"
        }
      };
      expectedMap[chores.toFullname(FRAMEWORK_PACKAGE_NAME, "logger-info")] = {
        "crateScope": FRAMEWORK_PACKAGE_NAME,
        "name": "logger-info",
        "object": {
          "info": {
            "alias": "log-info",
            "description": "[String]",
            "options": []
          },
          "handler": "[Function]"
        }
      };
      expectedMap[chores.toFullname(FRAMEWORK_PACKAGE_NAME, "logger-reset")] = {
        "crateScope": FRAMEWORK_PACKAGE_NAME,
        "name": "logger-reset",
        "object": {
          "info": {
            "alias": "log-reset",
            "description": "[String]",
            "options": []
          },
          "handler": "[Function]"
        }
      };
      expectedMap[chores.toFullname(FRAMEWORK_PACKAGE_NAME, "logger-set")] = {
        "crateScope": FRAMEWORK_PACKAGE_NAME,
        "name": "logger-set",
        "object": {
          "info": {
            "alias": "log-set",
            "description": "[String]",
            "options": [
              {
                "abbr": "t",
                "name": "transports",
                "description": "[String]",
                "required": false
              },
              {
                "abbr": "e",
                "name": "enabled",
                "description": "[String]",
                "required": false
              },
              {
                "abbr": "l",
                "name": "level",
                "description": "[String]",
                "required": false
              }
            ]
          },
          "handler": "[Function]"
        }
      };
      expectedMap[chores.toFullname(FRAMEWORK_PACKAGE_NAME, "sandbox-info")] = {
        "crateScope": FRAMEWORK_PACKAGE_NAME,
        "name": "sandbox-info",
        "object": {
          "info": {
            "alias": "sb-info",
            "description": "[String]",
            "options": []
          },
          "handler": "[Function]"
        }
      };
      expectedMap[chores.toFullname(FRAMEWORK_PACKAGE_NAME, "system-info")] = {
        "crateScope": FRAMEWORK_PACKAGE_NAME,
        "name": "system-info",
        "object": {
          "info": {
            "alias": "sys-info",
            "description": "[String]",
            "options": []
          },
          "handler": "[Function]"
        }
      };
      assert.deepEqual(routineMap, expectedMap);
    });
    it("load routines from complete application", function() {
      let bundleLoader = lab.createBundleLoader("fullapp");
      let originMap = {};
      bundleLoader.loadRoutines(originMap);
      false && console.info("routineMap: ", JSON.stringify(originMap, null, 2));
      let routineMap = lab.simplifyRoutines(originMap);
      false && console.info("routineMap: ", JSON.stringify(routineMap, null, 2));
      let expectedMap = {};
      expectedMap[chores.toFullname("application", "main-cmd1")] = {
        "crateScope": "application",
        "name": "main-cmd1",
        "object": {
          "info": {
            "description": "[String]",
            "options": []
          },
          "handler": "[Function]"
        }
      };
      expectedMap[chores.toFullname("application", "main-cmd2")] = {
        "crateScope": "application",
        "name": "main-cmd2",
        "object": {
          "info": {
            "description": "[String]",
            "options": []
          },
          "handler": "[Function]"
        }
      };
      expectedMap[chores.toFullname("plugin1", "plugin1-routine1")] = {
        "crateScope": "plugin1",
        "name": "plugin1-routine1",
        "object": {
          "info": {
            "description": "[String]",
            "options": []
          },
          "mode": "direct",
          "handler": "[Function]"
        }
      };
      expectedMap[chores.toFullname("plugin1", "plugin1-routine2")] = {
        "crateScope": "plugin1",
        "name": "plugin1-routine2",
        "object": {
          "info": {
            "description": "[String]",
            "options": []
          },
          "mode": "remote",
          "handler": "[Function]"
        }
      };
      expectedMap[chores.toFullname("plugin2", "plugin2-routine1")] = {
        "crateScope": "plugin2",
        "name": "plugin2-routine1",
        "object": {
          "info": {
            "description": "[String]",
            "schema": {
              "type": "object",
              "properties": {
                "number": {
                  "type": "number",
                  "minimum": 0,
                  "maximum": 100
                }
              }
            },
            "options": []
          },
          "handler": "[Function]"
        }
      };
      expectedMap[chores.toFullname("plugin2", "plugin2-routine3")] = {
        "crateScope": "plugin2",
        "name": "plugin2-routine3",
        "object": {
          "info": {
            "description": "[String]",
            "validate": "[Function]",
            "options": []
          },
          "handler": "[Function]"
        }
      };
      expectedMap[chores.toFullname("plugin3", "plugin3-routine1")] = {
        "crateScope": "plugin3",
        "name": "plugin3-routine1",
        "object": {
          "info": {
            "description": "[String]",
            "schema": {
              "type": "object",
              "properties": {
                "number": {
                  "type": "number",
                  "minimum": 0,
                  "maximum": 100
                }
              }
            },
            "options": []
          },
          "handler": "[Function]"
        }
      };
      expectedMap[chores.toFullname("plugin3", "plugin3-routine3")] = {
        "crateScope": "plugin3",
        "name": "plugin3-routine3",
        "object": {
          "info": {
            "description": "[String]",
            "validate": "[Function]",
            "options": []
          },
          "handler": "[Function]"
        }
      };
      expectedMap[chores.toFullname(FRAMEWORK_PACKAGE_NAME, "applica-info")] = {
        "crateScope": FRAMEWORK_PACKAGE_NAME,
        "name": "applica-info",
        "object": {
          "info": {
            "alias": "app-info",
            "description": "[String]",
            "options": []
          },
          "handler": "[Function]"
        }
      };
      expectedMap[chores.toFullname(FRAMEWORK_PACKAGE_NAME, "logger-info")] = {
        "crateScope": FRAMEWORK_PACKAGE_NAME,
        "name": "logger-info",
        "object": {
          "info": {
            "alias": "log-info",
            "description": "[String]",
            "options": []
          },
          "handler": "[Function]"
        }
      };
      expectedMap[chores.toFullname(FRAMEWORK_PACKAGE_NAME, "logger-reset")] = {
        "crateScope": FRAMEWORK_PACKAGE_NAME,
        "name": "logger-reset",
        "object": {
          "info": {
            "alias": "log-reset",
            "description": "[String]",
            "options": []
          },
          "handler": "[Function]"
        }
      };
      expectedMap[chores.toFullname(FRAMEWORK_PACKAGE_NAME, "logger-set")] = {
        "crateScope": FRAMEWORK_PACKAGE_NAME,
        "name": "logger-set",
        "object": {
          "info": {
            "alias": "log-set",
            "description": "[String]",
            "options": [
              {
                "abbr": "t",
                "name": "transports",
                "description": "[String]",
                "required": false
              },
              {
                "abbr": "e",
                "name": "enabled",
                "description": "[String]",
                "required": false
              },
              {
                "abbr": "l",
                "name": "level",
                "description": "[String]",
                "required": false
              }
            ]
          },
          "handler": "[Function]"
        }
      };
      expectedMap[chores.toFullname(FRAMEWORK_PACKAGE_NAME, "sandbox-info")] = {
        "crateScope": FRAMEWORK_PACKAGE_NAME,
        "name": "sandbox-info",
        "object": {
          "info": {
            "alias": "sb-info",
            "description": "[String]",
            "options": []
          },
          "handler": "[Function]"
        }
      };
      expectedMap[chores.toFullname(FRAMEWORK_PACKAGE_NAME, "system-info")] = {
        "crateScope": FRAMEWORK_PACKAGE_NAME,
        "name": "system-info",
        "object": {
          "info": {
            "alias": "sys-info",
            "description": "[String]",
            "options": []
          },
          "handler": "[Function]"
        }
      };
      assert.deepInclude(routineMap, expectedMap);
    });
  });

  describe("loadMetadata()", function() {
    before(function() {
      if (!chores.isUpgradeSupported("metadata-refiner")) this.skip();
    });
    it("load schemas from empty application", function() {
      let bundleLoader = lab.createBundleLoader();
      let metadataMap = {};
      bundleLoader.loadMetadata(metadataMap);
      false && console.info("metadataMap: ", JSON.stringify(metadataMap, null, 2));
      assert.deepEqual(metadataMap, {});
    });
    it("load schemas from simplest application", function() {
      let bundleLoader = lab.createBundleLoader("simple");
      let metadataMap = {};
      bundleLoader.loadMetadata(metadataMap);
      false && console.info("metadataMap: ", JSON.stringify(metadataMap, null, 2));
      assert.deepEqual(metadataMap, {});
    });
    it("load all of valid schemas from complete application", function() {
      let bundleLoader = lab.createBundleLoader("fullapp");
      let metadataMap = {};
      bundleLoader.loadMetadata(metadataMap);
      issueInspector.barrier({exitOnError: true});
      false && console.info("metadataMap: ", JSON.stringify(metadataMap, null, 2));
      let expectedMap = {};
      expectedMap[chores.toFullname("application", "sandbox")] = {
        "default": {
          "crateScope": "application",
          "pluginCode": "application",
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
              },
              "verbose": {
                "type": "boolean"
              }
            },
            "required": ["host", "port"]
          }
        }
      };
      expectedMap[chores.toFullname("sub-plugin1", "sandbox")] = {
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
      };
      expectedMap[chores.toFullname("sub-plugin2", "sandbox")] = {
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
      };
      assert.deepInclude(metadataMap, expectedMap);
    });
  });

  describe("loadServices()", function() {
    it("load services from empty application", function() {
      let bundleLoader = lab.createBundleLoader();
      let serviceMap = {};
      bundleLoader.loadServices(serviceMap);
      false && console.info("serviceMap: ", JSON.stringify(serviceMap, null, 2));
      assert.deepEqual(serviceMap, {});
    });
    it("load services from simplest application", function() {
      let bundleLoader = lab.createBundleLoader("simple");
      let serviceMap = {};
      bundleLoader.loadServices(serviceMap);
      false && console.info("serviceMap: ", JSON.stringify(serviceMap, null, 2));
      assert.deepEqual(serviceMap, {});
    });
    it("load all of valid services from complete application", function() {
      let bundleLoader = lab.createBundleLoader("fullapp");
      let originMap = {};
      bundleLoader.loadServices(originMap);
      issueInspector.barrier({exitOnError: true});
      false && console.info("serviceMap: ", util.inspect(originMap, { depth: 5 }));
      let serviceMap = lodash.mapValues(originMap, function(service) {
        return lodash.assign(lodash.pick(service, [
            "construktor.argumentProperties",
            "construktor.argumentSchema"
          ]), lodash.omit(service, ["construktor"]));
      });
      false && console.info("serviceMap: ", JSON.stringify(serviceMap, null, 2));
      let mainServiceField = chores.toFullname("application", "mainService");
      let mainServiceDepends = lodash.map([
        ["bridge1#anyname1z"],
        ["application", "bridge1#anyname1z"],
        ["plugin1", "bridge1#anyname1a"],
        ["plugin1", "bridge2#anyname2a"]
      ], function(eles) {
        return chores.toFullname.apply(chores, eles);
      });
      let expectedMap = {};
      expectedMap[mainServiceField] = {
        "construktor": {
          "argumentProperties": lodash.concat([
            "sandboxName",
            "sandboxOrigin",
            "sandboxConfig",
            "profileName",
            "profileConfig",
            "loggingFactory"], mainServiceDepends)
        },
        "crateScope": "application",
        "name": "mainService"
      };
      if (!chores.isUpgradeSupported("bridge-full-ref")) {
        let argumentProperties = lodash.get(expectedMap, [mainServiceField, "construktor", "argumentProperties"]);
        if (lodash.isArray(argumentProperties)) {
          lodash.remove(argumentProperties, function(depend) {
            return mainServiceDepends.indexOf(depend) >= 0;
          });
        }
      }
      expectedMap[chores.toFullname("sub-plugin1", "sublibService")] = {
        "construktor": {
          "argumentSchema": {
            "$id": chores.toFullname("sub-plugin1", "sublibService"),
            "type": "object",
            "properties": {
              "sandboxName": {
                "type": "string"
              },
              "sandboxOrigin": {
                "type": "object"
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
              },
              "sublibTrigger": {
                "type": "object"
              }
            }
          }
        },
        "crateScope": "sub-plugin1",
        "name": "sublibService"
      };
      expectedMap[chores.toFullname("sub-plugin2", "sublibService")] = {
        "construktor": {
          "argumentProperties": [
            "sandboxName",
            "sandboxOrigin",
            "sandboxConfig",
            "profileName",
            "profileConfig",
            "loggingFactory",
            "sublibTrigger"
          ]
        },
        "crateScope": "sub-plugin2",
        "name": "sublibService"
      };
      expectedMap[chores.toFullname("plugin1", "plugin1Service")] = {
        "construktor": {
          "argumentSchema": {
            "$id": chores.toFullname("plugin1", "plugin1Service"),
            "type": "object",
            "properties": {
              "sandboxName": {
                "type": "string"
              },
              "sandboxOrigin": {
                "type": "object"
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
        "name": "plugin1Service"
      };
      expectedMap[chores.toFullname("plugin2", "plugin2Service")] = {
        "construktor": {
          "argumentSchema": {
            "$id": chores.toFullname("plugin2", "plugin2Service"),
            "type": "object",
            "properties": {
              "sandboxName": {
                "type": "string"
              },
              "sandboxOrigin": {
                "type": "object"
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
        "name": "plugin2Service"
      };
      expectedMap[chores.toFullname("plugin3", "plugin3Service")] = {
        "construktor": {
          "argumentSchema": {
            "$id": chores.toFullname("plugin3", "plugin3Service"),
            "type": "object",
            "properties": {
              "sandboxName": {
                "type": "string"
              },
              "sandboxOrigin": {
                "type": "object"
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
        "crateScope": "plugin3",
        "name": "plugin3Service"
      };
      assert.deepInclude(serviceMap, expectedMap);
    });
  });

  describe("loadTriggers()", function() {
    it("load triggers from empty application", function() {
      let bundleLoader = lab.createBundleLoader();
      let triggerMap = {};
      bundleLoader.loadTriggers(triggerMap);
      false && console.info("triggerMap: ", JSON.stringify(triggerMap, null, 2));
      assert.deepEqual(triggerMap, {});
    });
    it("load triggers from simplest application", function() {
      let bundleLoader = lab.createBundleLoader("simple");
      let triggerMap = {};
      bundleLoader.loadTriggers(triggerMap);
      false && console.info("triggerMap: ", JSON.stringify(triggerMap, null, 2));
      assert.deepEqual(triggerMap, {});
    });
    it("load all of valid triggers from complete application", function() {
      let bundleLoader = lab.createBundleLoader("fullapp");
      let originMap = {};
      bundleLoader.loadTriggers(originMap);
      issueInspector.barrier({exitOnError: true});
      false && console.info("triggerMap: ", util.inspect(originMap, { depth: 5 }));
      let triggerMap = lodash.mapValues(originMap, function(trigger) {
        return lodash.assign(lodash.pick(trigger, [
            "construktor.argumentProperties",
            "construktor.argumentSchema"
          ]), lodash.omit(trigger, ["construktor"]));
      });
      false && console.info("triggerMap: ", JSON.stringify(triggerMap, null, 2));
      let mainTriggerField = chores.toFullname("application", "mainTrigger");
      let mainTriggerDepends = lodash.map([
        ["application", "bridge1#anyname1z"],
        ["application", "bridge2#anyname2z"],
        ["connector1#wrapper"],
        ["connector2#wrapper"],
        ["plugin2", "bridge1#anyname1b"],
        ["plugin2", "bridge2#anyname2b"]
      ], function(eles) {
        return chores.toFullname.apply(chores, eles);
      });
      let expectedMap = {};
      expectedMap[mainTriggerField] = {
        "construktor": {
          "argumentProperties": lodash.concat([
            "sandboxName",
            "sandboxOrigin",
            "sandboxConfig",
            "profileName",
            "profileConfig",
            "loggingFactory"
          ], mainTriggerDepends)
        },
        "crateScope": "application",
        "name": "mainTrigger"
      };
      if (!chores.isUpgradeSupported("bridge-full-ref")) {
        let argumentProperties = lodash.get(expectedMap, [mainTriggerField, "construktor", "argumentProperties"]);
        if (lodash.isArray(argumentProperties)) {
          lodash.remove(argumentProperties, function(depend) {
            return mainTriggerDepends.indexOf(depend) >= 0;
          });
        }
      }
      expectedMap[chores.toFullname("sub-plugin1", "sublibTrigger")] = {
        "construktor": {
          "argumentProperties": [
            "sandboxName",
            "sandboxOrigin",
            "sandboxConfig",
            "profileName",
            "profileConfig",
            "loggingFactory",
          ]
        },
        "crateScope": "sub-plugin1",
        "name": "sublibTrigger"
      };
      expectedMap[chores.toFullname("sub-plugin2", "sublibTrigger")] = {
        "construktor": {
          "argumentProperties": [
            "sandboxName",
            "sandboxOrigin",
            "sandboxConfig",
            "profileName",
            "profileConfig",
            "loggingFactory",
          ]
        },
        "crateScope": "sub-plugin2",
        "name": "sublibTrigger"
      };
      expectedMap[chores.toFullname("plugin1", "plugin1Trigger")] = {
        "construktor": {
          "argumentSchema": {
            "$id": chores.toFullname("plugin1", "plugin1Trigger"),
            "type": "object",
            "properties": {
              "sandboxName": {
                "type": "string"
              },
              "sandboxOrigin": {
                "type": "object"
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
        "name": "plugin1Trigger"
      };
      expectedMap[chores.toFullname("plugin2", "plugin2Trigger")] = {
        "construktor": {
          "argumentSchema": {
            "$id": chores.toFullname("plugin2", "plugin2Trigger"),
            "type": "object",
            "properties": {
              "sandboxName": {
                "type": "string"
              },
              "sandboxOrigin": {
                "type": "object"
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
        "name": "plugin2Trigger"
      };
      expectedMap[chores.toFullname("plugin3", "plugin3Trigger")] = {
        "construktor": {
          "argumentSchema": {
            "$id": chores.toFullname("plugin3", "plugin3Trigger"),
            "type": "object",
            "properties": {
              "sandboxName": {
                "type": "string"
              },
              "sandboxOrigin": {
                "type": "object"
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
        "crateScope": "plugin3",
        "name": "plugin3Trigger"
      };
      assert.deepInclude(triggerMap, expectedMap);
    });
  });

  after(function() {
    LogTracer.clearInterceptors();
    envcloak.reset();
  });
});
