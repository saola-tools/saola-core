'use strict';

var lab = require('../index');
var Devebot = lab.getDevebot();
var chores = Devebot.require('chores');
var lodash = Devebot.require('lodash');
var debugx = Devebot.require('pinbug')('tdd:devebot:base:kernel');
var assert = require('chai').assert;
var LogConfig = require('logolite').LogConfig;
var LogTracer = require('logolite').LogTracer;
var EnvMask = require('envmask');
var envmask = EnvMask.instance;
var sinon = require('sinon');

describe('tdd:devebot:core:manifest-handler', function() {
  this.timeout(lab.getDefaultTimeout());

  var stepEnv = new EnvMask();
  var issueInspector = lab.getIssueInspector();

  before(function() {
    envmask.setup({
      NODE_ENV: 'test',
      LOGOLITE_ALWAYS_ENABLED: 'all',
      LOGOLITE_ALWAYS_MUTED: 'all',
      DEVEBOT_FORCING_SILENT: 'issue-inspector'
    });
    LogConfig.reset();
    issueInspector.reset();
    chores.clearCache();
  });

  describe('.validateConfig()', function() {
    var ManifestHandler = lab.acquireDevebotModule('backbone/manifest-handler');
    var combineBridgeSchema = lab.stubModuleFunction(ManifestHandler, 'combineBridgeSchema');
    var validateBridgeConfig = lab.stubModuleFunction(ManifestHandler, 'validateBridgeConfig');
    var combineBundleSchema = lab.stubModuleFunction(ManifestHandler, 'combineBundleSchema');
    var validateBundleConfig = lab.stubModuleFunction(ManifestHandler, 'validateBundleConfig');
    var bridgeList = [];
    var bundleList = [];
    var pluginList = lab.extractPluginList(bundleList);
    var nameResolver = lab.getNameResolver(lodash.map(pluginList, 'name'), lodash.map(bridgeList, 'name'));

    var manifestHandler = new ManifestHandler({
      nameResolver, issueInspector, bridgeList, bundleList
    });

    beforeEach(function() {
      combineBridgeSchema.reset();
      validateBridgeConfig.reset();
      combineBundleSchema.reset();
      validateBundleConfig.reset();
    });

    it("should return empty result if method is invoked without arguments", function() {
      combineBridgeSchema.returns({});
      combineBundleSchema.returns({});
      var result = manifestHandler.validateConfig();
      // verify output
      assert.isArray(result);
      assert.lengthOf(result, 0);
      // verify invocations
      assert.isTrue(combineBridgeSchema.calledOnce);
      assert.isTrue(validateBridgeConfig.calledOnce);
      assert.isTrue(combineBundleSchema.calledOnce);
      assert.isTrue(validateBundleConfig.calledOnce);
      // verify arguments
      assert.lengthOf(validateBridgeConfig.firstCall.args, 4);
      var bridgeConfig = validateBridgeConfig.firstCall.args[1];
      assert.deepEqual(bridgeConfig, {});
      assert.lengthOf(validateBundleConfig.firstCall.args, 4);
      var pluginConfig = validateBundleConfig.firstCall.args[1];
      assert.deepEqual(pluginConfig, { profile: {}, sandbox: {} });
    });

    it("dispatch a function call to other functions properly (popular case)", function() {
      combineBridgeSchema.returns({});
      combineBundleSchema.returns({});
      var configStore = {
        "sandbox": {
          "mixture": {
            "application": {
              "contextPath": "path/to/appbox"
            },
            "plugins": {
              "subPlugin1": {
                "host": "127.0.0.1",
                "port": 17701
              },
              "subPlugin2": {
                "host": "127.0.0.1",
                "port": 17702
              },
              "plugin1": {
                "total": 1
              },
              "plugin2": {
                "total": 2
              },
              "plugin3": {
                "total": 3
              }
            },
            "bridges": {
              "bridge1": {
                "subPlugin1": {
                  "instance": {
                    "total": 1
                  }
                }
              },
              "bridge2": {
                "subPlugin1": {
                  "instance": {
                    "total": 2
                  }
                },
                "subPlugin2": {
                  "instance": {
                    "total": 2
                  }
                }
              },
              "bridge3": {
                "subPlugin2": {
                  "instance": {
                    "total": 3
                  }
                },
                "application": {
                  "instance": {
                    "total": 3
                  }
                }
              },
            }
          }
        }
      };
      var result = manifestHandler.validateConfig(configStore);
      // verify output
      assert.isArray(result);
      assert.lengthOf(result, 0);
      // verify invocations
      assert.isTrue(combineBridgeSchema.calledOnce);
      assert.isTrue(validateBridgeConfig.calledOnce);
      assert.isTrue(combineBundleSchema.calledOnce);
      assert.isTrue(validateBundleConfig.calledOnce);
      // verify arguments
      assert.lengthOf(validateBridgeConfig.firstCall.args, 4);
      var bridgeConfig = validateBridgeConfig.firstCall.args[1];
      assert.deepEqual(bridgeConfig, {
        "bridge1": {
          "subPlugin1": {
            "instance": {
              "total": 1
            }
          }
        },
        "bridge2": {
          "subPlugin1": {
            "instance": {
              "total": 2
            }
          },
          "subPlugin2": {
            "instance": {
              "total": 2
            }
          }
        },
        "bridge3": {
          "subPlugin2": {
            "instance": {
              "total": 3
            }
          },
          "application": {
            "instance": {
              "total": 3
            }
          }
        },
      });
      assert.lengthOf(validateBundleConfig.firstCall.args, 4);
      var pluginConfig = validateBundleConfig.firstCall.args[1];
      assert.deepEqual(pluginConfig, {
        profile: {},
        sandbox: {
          "application": {
            "contextPath": "path/to/appbox"
          },
          "plugins": {
            "subPlugin1": {
              "host": "127.0.0.1",
              "port": 17701
            },
            "subPlugin2": {
              "host": "127.0.0.1",
              "port": 17702
            },
            "plugin1": {
              "total": 1
            },
            "plugin2": {
              "total": 2
            },
            "plugin3": {
              "total": 3
            }
          }
        }
      });
    });

    after(function() {
    });
  });

  describe('extractBundleSchema()', function() {
    var ManifestHandler = lab.acquireDevebotModule('backbone/manifest-handler');
    var combineBundleSchema = ManifestHandler.__get__('combineBundleSchema');
    var {loggingFactory, schemaValidator} = lab.createBasicServices('fullapp');
    var L = loggingFactory.getLogger();
    var T = loggingFactory.getTracer();

    after(function() {
      stepEnv.reset();
      chores.clearCache();
    });

    it("should extract plugin manifest and enrich with dependencies (empty dependencies)", function() {
      if (!chores.isUpgradeSupported('manifest-refiner') || chores.isUpgradeSupported('metadata-refiner')) {
        this.skip();
      }
      var nameResolver = lab.getNameResolver(['devebot-dp-wrapper1','devebot-dp-wrapper2'], []);
      var C = {L, T, schemaValidator, nameResolver};
      // note: crateScope = nameResolver.getOriginalNameOf(pluginName, 'plugin')
      var bundleList = [
        {
          "type": "plugin",
          "name": "devebot-dp-wrapper1",
          "path": lab.getLibHome('devebot-dp-wrapper1'),
          "presets": {},
          "bridgeDepends": [],
          "pluginDepends": [],
          "manifest": {
            "config": {
              "migration": {},
              "validation": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "host": {
                      "type": "string"
                    },
                    "port": {
                      "type": "number"
                    },
                  },
                  "required": [ "host", "port" ]
                },
              },
            },
          },
          "version": "0.1.1",
        },
        {
          "type": "plugin",
          "name": "devebot-dp-wrapper2",
          "path": lab.getLibHome('devebot-dp-wrapper2'),
          "presets": {},
          "bridgeDepends": [],
          "pluginDepends": [],
          "manifest": {
            "config": {
              "migration": {},
              "validation": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "host": {
                      "type": "string"
                    },
                    "port": {
                      "type": "number"
                    },
                  },
                  "required": [ "host", "port" ]
                },
              },
            },
          },
          "version": "0.1.2",
        }
      ];

      var bundleSchema = combineBundleSchema(C, bundleList);
      false && console.log('bundleSchema: %s', JSON.stringify(bundleSchema, null, 2));
      assert.deepEqual(bundleSchema, {
        "profile": {},
        "sandbox": {
          "plugins": {
            "wrapper1": {
              "crateScope": "devebot-dp-wrapper1",
              "bridgeDepends": [],
              "pluginDepends": [],
              "schema": {
                "type": "object",
                "properties": {
                  "host": {
                    "type": "string"
                  },
                  "port": {
                    "type": "number"
                  },
                },
                "required": [ "host", "port" ],
              },
            },
            "wrapper2": {
              "crateScope": "devebot-dp-wrapper2",
              "bridgeDepends": [],
              "pluginDepends": [],
              "schema": {
                "type": "object",
                "properties": {
                  "host": {
                    "type": "string"
                  },
                  "port": {
                    "type": "number"
                  },
                },
                "required": [ "host", "port" ],
              },
            },
          }
        }
      });
    });

    it("should extract plugin manifest and enrich with dependencies (normal case)", function() {
      if (!chores.isUpgradeSupported('manifest-refiner') || chores.isUpgradeSupported('metadata-refiner')) {
        this.skip();
      }
      var nameResolver = lab.getNameResolver([
        'sub-plugin1', 'sub-plugin2', 'plugin1', 'plugin2', 'plugin3'
      ], [
        "bridge1", "bridge2", "bridge3"
      ]);
      var C = {L, T, schemaValidator, nameResolver};
      var bundleList = [
        {
          "type": "application",
          "name": "fullapp",
          "path": "/test/app/fullapp",
          "manifest": {
            "config": {
              "migration": {},
              "validation": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "contextPath": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "version": "0.1.0",
        },
        {
          "type": "plugin",
          "name": "sub-plugin1",
          "path": lab.getLibHome('sub-plugin1'),
          "presets": {},
          "bridgeDepends": [ "bridge1", "bridge2" ],
          "pluginDepends": [ "plugin1", "plugin2" ],
          "manifest": {
            "config": {
              "migration": {},
              "validation": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "host": {
                      "type": "string"
                    },
                    "port": {
                      "type": "number"
                    },
                  },
                  "required": [ "host", "port" ]
                },
              },
            },
          },
          "version": "0.1.1",
        },
        {
          "type": "plugin",
          "name": "sub-plugin2",
          "path": lab.getLibHome('sub-plugin2'),
          "presets": {},
          "bridgeDepends": [ "bridge2", "bridge3" ],
          "pluginDepends": [ "plugin2", "plugin3" ],
          "manifest": {
            "config": {
              "migration": {},
              "validation": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "host": {
                      "type": "string"
                    },
                    "port": {
                      "type": "number"
                    },
                  },
                  "required": [ "host", "port" ]
                },
              },
            },
          },
          "version": "0.1.2",
        },
        {
          "type": "plugin",
          "name": "plugin1",
          "path": "/test/lib/plugin1",
          "presets": {
            "configTags": "bridge[dialect-bridge]"
          },
          "bridgeDepends": [ "bridge1", "bridge2" ],
          "pluginDepends": [],
        },
        {
          "type": "plugin",
          "name": "plugin2",
          "path": "/test/lib/plugin2",
          "presets": {
            "configTags": "bridge[dialect-bridge]"
          },
          "bridgeDepends": [ "bridge1", "bridge2" ],
          "pluginDepends": [],
        },
        {
          "type": "plugin",
          "name": "plugin3",
          "path": "/test/lib/plugin3",
          "presets": {},
          "bridgeDepends": [],
          "pluginDepends": [],
        }
      ];
      var expectedBundleSchema = {
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
                },
                "required": [ "host", "port" ]
              },
              "bridgeDepends": [ "bridge1", "bridge2" ],
              "pluginDepends": [ "plugin1", "plugin2" ],
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
                },
                "required": [ "host", "port" ]
              },
              "bridgeDepends": [ "bridge2", "bridge3" ],
              "pluginDepends": [ "plugin2", "plugin3" ],
            },
            "plugin1": {
              "bridgeDepends": [ "bridge1", "bridge2" ],
              "pluginDepends": [],
            },
            "plugin2": {
              "bridgeDepends": [ "bridge1", "bridge2" ],
              "pluginDepends": [],
            },
            "plugin3": {
              "bridgeDepends": [],
              "pluginDepends": [],
            }
          }
        }
      };
      var bundleSchema = combineBundleSchema(C, bundleList);
      false && console.log('bundleSchema: %s', JSON.stringify(bundleSchema, null, 2));
      assert.deepEqual(bundleSchema, expectedBundleSchema);
    });
  });

  describe('validateBundleConfig()', function() {
    var ManifestHandler = lab.acquireDevebotModule('backbone/manifest-handler');
    var checkSandboxConstraintsOfCrates = ManifestHandler.__get__('checkSandboxConstraintsOfCrates');
    var {loggingFactory, schemaValidator} = lab.createBasicServices('fullapp');
    var L = loggingFactory.getLogger();
    var T = loggingFactory.getTracer();
    var C = {L, T, schemaValidator};

    after(function() {
      stepEnv.reset();
      chores.clearCache();
    });

    it("checkSandboxConstraintsOfCrates() invokes checkConstraints function properly", function() {
      if (!chores.isUpgradeSupported('metadata-refiner') || chores.isUpgradeSupported('manifest-refiner')) {
        this.skip();
      }
      var result = [];
      var fakedCheckers = {};
      lodash.forEach(['application', 'subPlugin1', 'subPlugin2'], function(pluginName) {
        fakedCheckers[pluginName] = sinon.stub();
        fakedCheckers[pluginName].callsFake(function(depends) {
          false && console.log('config of dependencies: %s', JSON.stringify(depends, null, 2));
          return true;
        });
      })
      var sandboxConfig = {
        "application": {
          "contextPath": "path/to/appbox"
        },
        "plugins": {
          "subPlugin1": {
            "host": "127.0.0.1",
            "port": 17701
          },
          "subPlugin2": {
            "host": "127.0.0.1",
            "port": 17702
          },
          "plugin1": {
            "total": 1
          },
          "plugin2": {
            "total": 2
          },
          "plugin3": {
            "total": 3
          }
        },
        "bridges": {
          "bridge1": {
            "subPlugin1": {
              "instance": {
                "total": 1
              }
            }
          },
          "bridge2": {
            "subPlugin1": {
              "instance": {
                "total": 2
              }
            },
            "subPlugin2": {
              "instance": {
                "total": 2
              }
            }
          },
          "bridge3": {
            "subPlugin2": {
              "instance": {
                "total": 3
              }
            },
            "application": {
              "instance": {
                "total": 3
              }
            }
          },
        }
      };
      var sandboxSchema = {
        "application": {
          "crateScope": "application",
          "schema": {
            "type": "object",
            "properties": {
              "contextPath": {
                "type": "string"
              }
            }
          },
          "bridgeDepends": [ "bridge3" ],
          "pluginDepends": [ "subPlugin1", "subPlugin2" ],
          "checkConstraints": fakedCheckers['application']
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
            "bridgeDepends": [ "bridge1", "bridge2" ],
            "pluginDepends": [ "plugin1", "plugin2" ],
            "checkConstraints": fakedCheckers['subPlugin1']
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
            "bridgeDepends": [ "bridge2", "bridge3" ],
            "pluginDepends": [ "plugin2", "plugin3" ],
            "checkConstraints": fakedCheckers['subPlugin2']
          },
          "plugin1": {
            "crateScope": "plugin1",
            "schema": {},
            "bridgeDepends": [ "bridge1", "bridge2" ],
            "pluginDepends": []
          },
          "plugin2": {
            "crateScope": "plugin2",
            "schema": {},
            "bridgeDepends": [ "bridge1", "bridge2" ],
            "pluginDepends": []
          },
          "plugin3": {
            "crateScope": "plugin3",
            "schema": {},
            "bridgeDepends": [],
            "pluginDepends": []
          }
        }
      };
      checkSandboxConstraintsOfCrates(C, result, sandboxConfig, sandboxSchema);
      assert.equal(fakedCheckers['application'].callCount, 1);
      assert.deepEqual(fakedCheckers['application'].firstCall.args[0], {
        "plugins": {
          "subPlugin1": {
            "host": "127.0.0.1",
            "port": 17701
          },
          "subPlugin2": {
            "host": "127.0.0.1",
            "port": 17702
          }
        },
        "bridges": {
          "bridge3": {
            "instance": {
              "total": 3
            }
          }
        },
        "application": {
          "contextPath": "path/to/appbox"
        }
      });
      assert.equal(fakedCheckers['subPlugin1'].callCount, 1);
      assert.deepEqual(fakedCheckers['subPlugin1'].firstCall.args[0], {
        "plugins": {
          "subPlugin1": {
            "host": "127.0.0.1",
            "port": 17701
          },
          "plugin1": {
            "total": 1
          },
          "plugin2": {
            "total": 2
          }
        },
        "bridges": {
          "bridge1": {
            "instance": {
              "total": 1
            }
          },
          "bridge2": {
            "instance": {
              "total": 2
            }
          }
        }
      });
      assert.equal(fakedCheckers['subPlugin2'].callCount, 1);
      assert.deepEqual(fakedCheckers['subPlugin2'].firstCall.args[0], {
        "plugins": {
          "subPlugin2": {
            "host": "127.0.0.1",
            "port": 17702
          },
          "plugin2": {
            "total": 2
          },
          "plugin3": {
            "total": 3
          }
        },
        "bridges": {
          "bridge2": {
            "instance": {
              "total": 2
            }
          },
          "bridge3": {
            "instance": {
              "total": 3
            }
          }
        }
      });
      false && console.log('Result: %s', JSON.stringify(result, null, 2));
      assert.deepEqual(result, [
        {
          "stage": "config/constraints",
          "name": "application",
          "type": "application",
          "hasError": false
        },
        {
          "stage": "config/constraints",
          "name": "sub-plugin1",
          "type": "plugin",
          "hasError": false
        },
        {
          "stage": "config/constraints",
          "name": "sub-plugin2",
          "type": "plugin",
          "hasError": false
        }
      ]);
    });
  });

  describe('extractBridgeSchema()', function() {
    var ManifestHandler = lab.acquireDevebotModule('backbone/manifest-handler');
    var combineBridgeSchema = ManifestHandler.__get__('combineBridgeSchema');
    var {loggingFactory, schemaValidator} = lab.createBasicServices('fullapp');
    var nameResolver = lab.getNameResolver([], [
      'bridge1', 'bridge2', 'bridge3', 'bridge4', 'devebot-co-connector1', 'devebot-co-connector2'
    ]);
    var L = loggingFactory.getLogger();
    var T = loggingFactory.getTracer();
    var CTX = {L, T, schemaValidator, nameResolver};

    var expectedSchema = {
      "bridge1": {},
      "bridge2": {
        "enabled": false,
      },
      "bridge3": {},
      "bridge4": {
        "enabled": false,
      },
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

    after(function() {
      stepEnv.reset();
      chores.clearCache();
    });

    it("should extract plugin schema from bridge manifest properly", function() {
      if (!chores.isUpgradeSupported('manifest-refiner') || chores.isUpgradeSupported('metadata-refiner')) {
        this.skip();
      }
      var bridgeList = lodash.values({
        "/test/lib/bridge1": {
          "name": "bridge1",
          "type": "bridge",
          "path": "/test/lib/bridge1",
        },
        "/test/lib/bridge2": {
          "name": "bridge2",
          "type": "bridge",
          "path": "/test/lib/bridge2",
          "presets": {
            "schemaValidation": false
          },
        },
        "/test/lib/bridge3": {
          "name": "bridge3",
          "type": "bridge",
          "path": "/test/lib/bridge3",
        },
        "/test/lib/bridge4": {
          "name": "bridge4",
          "type": "bridge",
          "path": "/test/lib/bridge4",
          "presets": {
            "schemaValidation": false
          },
        },
        "/test/lib/devebot-co-connector1": {
          "name": "devebot-co-connector1",
          "type": "bridge",
          "path": "/test/lib/devebot-co-connector1",
          "manifest": {
            "config": {
              "migration": {},
              "validation": {
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
                },
              },
            },
          },
        },
        "/test/lib/devebot-co-connector2": {
          "name": "devebot-co-connector2",
          "type": "bridge",
          "path": "/test/lib/devebot-co-connector2",
          "manifest": {
            "config": {
              "migration": {},
              "validation": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "params": {
                      "type": "object"
                    },
                    "handler": {}
                  },
                  "required": [ "params" ]
                },
              },
            },
          },
        },
      })

      var bridgeSchema = combineBridgeSchema(CTX, bridgeList);

      false && console.log('bridgeSchema: %s', JSON.stringify(bridgeSchema, null, 2));
      assert.deepEqual(bridgeSchema, expectedSchema);
    });
  });

  describe('validateBridgeConfig()', function() {
    var ManifestHandler = lab.acquireDevebotModule('backbone/manifest-handler');
    var validateBridgeConfig = ManifestHandler.__get__('validateBridgeConfig');
    var {loggingFactory, schemaValidator} = lab.createBasicServices('fullapp');
    var L = loggingFactory.getLogger();
    var T = loggingFactory.getTracer();

    after(function() {
      stepEnv.reset();
      chores.clearCache();
    });

    it("result should be ok if bridge config is valid with bridge schema", function() {
      if (!chores.isUpgradeSupported('metadata-refiner') || chores.isUpgradeSupported('manifest-refiner')) {
        this.skip();
      }
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
              "refPath": "sandbox -> connector1 -> application -> wrapper",
              "refType": "application",
              "refName": "fullapp",
              "host": "0.0.0.0",
              "port": 19090
            }
          }
        },
        "connector2": {
          "application": {
            "wrapper": {
              "refPath": "sandbox -> connector2 -> application -> wrapper",
              "refType": "application",
              "refName": "fullapp",
              "params": {
                "username": "admin",
                "password": "88888888"
              }
            }
          }
        }
      };
      var bridgeSchema = {
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
        }
      };
      var result = [];
      validateBridgeConfig({L, T, schemaValidator}, bridgeConfig, bridgeSchema, result);
      false && console.log('validation result: %s', JSON.stringify(result, null, 2));
      if (!chores.isUpgradeSupported('bridge-full-ref')) return;
      assert.sameDeepMembers(result, [
        {
          "stage": "config/schema",
          "name": chores.toFullname("application", "connector1#wrapper"),
          "type": "bridge",
          "hasError": false
        },
        {
          "stage": "config/schema",
          "name": chores.toFullname("application", "connector2#wrapper"),
          "type": "bridge",
          "hasError": false
        }
      ]);
    });
  });

  describe('loadManifest()', function() {
    var ManifestHandler = lab.acquireDevebotModule('backbone/manifest-handler');
    var loadManifest = ManifestHandler.__get__('loadManifest');
    assert.isFunction(loadManifest);

    it('load manifest of modules properly', function() {
      var appName = 'setting-with-metadata';
      var manifest = loadManifest({
        type: 'application',
        name: appName,
        path: lab.getAppHome(appName),
      }, issueInspector);
      assert.isObject(lodash.get(manifest, ['config', 'migration']));
      assert.isObject(lodash.get(manifest, ['config', 'validation', 'schema']));
      assert.isFunction(lodash.get(manifest, ['config', 'validation', 'checkConstraints']));
    });

    it('return null if manifest not found', function() {
      var appName = 'plugin-reference-alias';
      var manifest = loadManifest({
        type: 'application',
        name: appName,
        path: lab.getAppHome(appName),
      }, issueInspector);
      assert.isNull(manifest);
    });

    it('raise an issue if manifest is invalid', function() {
      var issueInspector = { collect: sinon.stub() }
      var appName = 'invalid-manifest-schema';
      var manifest = loadManifest({
        type: 'application',
        name: appName,
        path: lab.getAppHome(appName),
      }, issueInspector);
      // returned manifest object
      assert.isObject(lodash.get(manifest, ['config', 'migration']));
      assert.isString(lodash.get(manifest, ['config', 'validation', 'schema']));
      // issueInspector.collect
      assert.isTrue(issueInspector.collect.calledOnce);
      var collectArgs = lodash.cloneDeep(issueInspector.collect.firstCall.args);
      assert.lengthOf(collectArgs, 1);
      var collectArg = collectArgs[0];
      collectArg.stack = JSON.parse(collectArg.stack);
      assert.deepEqual(collectArg, {
        "stage": "manifest",
        "type": "application",
        "name": "invalid-manifest-schema",
        "hasError": true,
        "stack": [
          {
              "keyword": "type",
              "dataPath": ".config.validation.schema",
              "schemaPath": "#/properties/config/properties/validation/properties/schema/type",
              "params": {
                  "type": "object"
              },
              "message": "should be object"
          },
          {
              "keyword": "type",
              "dataPath": ".config.validation.schema",
              "schemaPath": "#/type",
              "params": {
                  "type": "object"
              },
              "message": "should be object"
          },
          {
              "keyword": "oneOf",
              "dataPath": ".config.validation.schema",
              "schemaPath": "#/properties/config/properties/validation/properties/schema/oneOf",
              "params": {},
              "message": "should match exactly one schema in oneOf"
          }
        ]
      });
    });
  });

  after(function() {
    envmask.reset();
  });
});
