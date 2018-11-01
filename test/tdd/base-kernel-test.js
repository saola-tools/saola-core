'use strict';

var lab = require('../index');
var Devebot = lab.getDevebot();
var chores = Devebot.require('chores');
var lodash = Devebot.require('lodash');
var debugx = Devebot.require('pinbug')('tdd:devebot:base:kernel');
var assert = require('chai').assert;
var LogConfig = require('logolite').LogConfig;
var LogTracer = require('logolite').LogTracer;
var envmask = require('envmask').instance;
var envbox = require(lab.getDevebotModule('utils/envbox'));
var rewire = require('rewire');

describe('tdd:devebot:base:kernel', function() {
  this.timeout(lab.getDefaultTimeout());

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
    envbox.clearCache();
  });

  describe('validateBridgeConfig()', function() {
    var validateBridgeConfig = rewire(lab.getDevebotModule('kernel')).__get__('validateBridgeConfig');
    var {loggingFactory, schemaValidator} = lab.createBasicServices('fullapp');
    var L = loggingFactory.getLogger();
    var T = loggingFactory.getTracer();

    it("result should be ok if bridge config is valid with bridge schema", function() {
      var result = [];
      validateBridgeConfig({L, T, schemaValidator}, {
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
      }, {
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
              "required": [
                "host",
                "port"
              ]
            }
          }
        },
        "connector2": {
          "name": "devebot-co-connector2",
          "metadata": {
            "schema": {
              "type": "object",
              "properties": {
                "params": {
                  "type": "object"
                },
                "handler": {}
              },
              "required": [
                "params"
              ]
            }
          }
        }
      }, result);
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
  })

  describe('validate config/schemas', function() {
    var loggingStore = {};

    before(function() {
      LogTracer.setupDefaultInterceptors([{
        accumulator: loggingStore,
        mappings: [{
          allTags: [ chores.toFullname('devebot', 'kernel'), 'bridge-config-schema-input' ],
          storeTo: 'bridgeInput'
        }, {
          allTags: [ chores.toFullname('devebot', 'kernel'), 'plugin-config-schema-input' ],
          storeTo: 'pluginInput'
        }, {
          allTags: [ chores.toFullname('devebot', 'kernel'), 'validate-bridge-config-by-schema' ],
          storeTo: 'bridgeData'
        }, {
          allTags: [ chores.toFullname('devebot', 'kernel'), 'validate-plugin-config-by-schema' ],
          storeTo: 'pluginData'
        }, {
          allTags: [ chores.toFullname('devebot', 'kernel'), 'validating-config-by-schema-result' ],
          storeTo: 'outputValidation'
        }, {
          allTags: [ chores.toFullname('devebot', 'issueInspector'), 'examine', 'metadata-validating' ],
          matchingField: 'invoker',
          matchingRule: chores.toFullname('devebot', 'kernel'),
          storeTo: 'errorSummary'
        }]
      }]);
    });

    beforeEach(function() {
      LogTracer.reset().empty(loggingStore);
      issueInspector.reset();
    });

    it('kernel constructor is ok if no error has occurred in validating', function() {
      var unhook = lab.preventExit();

      var kernel = lab.createKernel('fullapp');

      var pluginMetadata = lodash.get(loggingStore, 'pluginInput.0.metadata', {});
      false && console.log('pluginMetadata: %s', JSON.stringify(pluginMetadata, null, 2));

      var bridgeConfig = lodash.get(loggingStore, 'bridgeData.0.bridgeConfig', {});
      var bridgeSchema = lodash.get(loggingStore, 'bridgeData.0.bridgeSchema', {});
      false && console.log('bridgeConfig: %s', JSON.stringify(bridgeConfig, null, 2));
      false && console.log('bridgeSchema: %s', JSON.stringify(bridgeSchema, null, 2));

      var pluginConfig = lodash.get(loggingStore, 'pluginData.0.pluginConfig', {});
      var pluginSchema = lodash.get(loggingStore, 'pluginData.0.pluginSchema', {});
      false && console.log('pluginConfig: %s', JSON.stringify(pluginConfig, null, 2));
      false && console.log('pluginSchema: %s', JSON.stringify(pluginSchema, null, 2));

      var result = lodash.get(loggingStore, 'outputValidation.0.result', []);
      false && lodash.forEach(result, function(item) {
        console.log('- validation result: %s', JSON.stringify(lodash.omit(item, ['stack'])));
        if (item.hasError) {
          console.log('  - stack:\n%s', item.stack);
        }
      });

      var expectedBridges = {
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
      
      if (!chores.isUpgradeSupported('bridge-full-ref')) {
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

      assert.deepInclude(pluginConfig.sandbox, {
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
              "field4": [
                1,
                2,
                3,
                null,
                "4"
              ]
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
              "field4": [
                1,
                2,
                3,
                null,
                "4"
              ]
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

      var expectedPluginSchemaSandbox = {
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
            "required": [
              "host",
              "port"
            ]
          }
        },
        "plugins": {
          "plugin1": {
            "bridgeDepends": [
              "bridge1",
              "bridge2"
            ],
            "pluginDepends": []
          },
          "plugin2": {
            "bridgeDepends": [
              "bridge1",
              "bridge2"
            ],
            "pluginDepends": []
          },
          "plugin3": {
            "bridgeDepends": [],
            "pluginDepends": []
          },
          "subPlugin1": {
            "crateScope": "sub-plugin1",
            "bridgeDepends": [
              "bridge1",
              "bridge2"
            ],
            "pluginDepends": [
              "plugin1",
              "plugin2"
            ],
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
            "bridgeDepends": [
              "bridge2",
              "bridge3"
            ],
            "pluginDepends": [
              "plugin2",
              "plugin3"
            ],
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
      if (!chores.isUpgradeSupported('presets')) {
        lodash.forEach(lodash.keys(expectedPluginSchemaSandbox.plugins), function(pluginName) {
          let plugin = lodash.omit(expectedPluginSchemaSandbox.plugins[pluginName], ['bridgeDepends', 'pluginDepends']);
          if (lodash.isEmpty(plugin)) {
            delete expectedPluginSchemaSandbox.plugins[pluginName];
          } else {
            expectedPluginSchemaSandbox.plugins[pluginName] = plugin;
          }
        });
      }
      assert.deepInclude(pluginSchema.sandbox, expectedPluginSchemaSandbox);

      // errorSummary.0 <= configLoader, errorSummary.1 <= kernel
      if (true) {
        assert.lengthOf(lodash.get(loggingStore, 'errorSummary', []), 1);
        var errorSummary = lodash.pick(lodash.get(loggingStore, 'errorSummary.0', {}), [
          'totalOfErrors', 'errors'
        ]);
        assert.deepEqual(errorSummary, { totalOfErrors: 0, errors: [] });
      } else {
        console.log('errorSummary: %s', JSON.stringify(loggingStore.errorSummary, null, 2));
      }

      var totalOfExit = unhook();
      assert.equal(totalOfExit, 0);
    });

    it("loading an invalid bridge's configure make program exit", function() {
      var unhook = lab.preventExit();
      var kernel = lab.createKernel('invalid-bridge-config');

      // errorSummary.0 <= kernel
      if (true) {
        assert.lengthOf(lodash.get(loggingStore, 'errorSummary', []), 1);
        var errorSummary = lodash.pick(lodash.get(loggingStore, 'errorSummary.0', {}), [
          'totalOfErrors', 'errors'
        ]);
        assert.equal(errorSummary.totalOfErrors, 1);
        assert.lengthOf(errorSummary.errors, 1);
      } else {
        console.log('errorSummary: %s', JSON.stringify(loggingStore.errorSummary, null, 2));
      }

      var totalOfExit = unhook();
      assert.equal(totalOfExit, 2);
    });

    it("loading an invalid bridge's configure but skipping validation", function() {
      if (!chores.isUpgradeSupported(['presets'])) {
        this.skip();
        return;
      }
      var unhook = lab.preventExit();
      var kernel = lab.createKernel('invalid-bridge-config-but-skip');

      // errorSummary.0 <= kernel
      if (true) {
        assert.lengthOf(lodash.get(loggingStore, 'errorSummary', []), 1);
        var errorSummary = lodash.pick(lodash.get(loggingStore, 'errorSummary.0', {}), [
          'totalOfErrors', 'errors'
        ]);
        assert.equal(errorSummary.totalOfErrors, 0);
        assert.lengthOf(errorSummary.errors, 0);
      } else {
        console.log('errorSummary: %s', JSON.stringify(loggingStore.errorSummary, null, 2));
      }

      var totalOfExit = unhook();
      assert.equal(totalOfExit, 0);
    });

    it("loading an invalid plugin's configure make program exit", function() {
      var unhook = lab.preventExit();
      var kernel = lab.createKernel('invalid-plugin-config');

      // errorSummary.0 <= kernel
      if (true) {
        assert.lengthOf(lodash.get(loggingStore, 'errorSummary', []), 1);
        var errorSummary = lodash.pick(lodash.get(loggingStore, 'errorSummary.0', {}), [
          'totalOfErrors', 'errors'
        ]);
        assert.equal(errorSummary.totalOfErrors, 2);
        assert.lengthOf(errorSummary.errors, 2);
      } else {
        console.log('errorSummary: %s', JSON.stringify(loggingStore.errorSummary, null, 2));
      }

      var totalOfExit = unhook();
      assert.equal(totalOfExit, 2);
    });

    it("loading an invalid plugin's configure but skipping validation", function() {
      if (!chores.isUpgradeSupported(['presets'])) {
        this.skip();
        return;
      }
      var unhook = lab.preventExit();
      var kernel = lab.createKernel('invalid-plugin-config-but-skip');

      // errorSummary.0 <= kernel
      if (true) {
        assert.lengthOf(lodash.get(loggingStore, 'errorSummary', []), 1);
        var errorSummary = lodash.pick(lodash.get(loggingStore, 'errorSummary.0', {}), [
          'totalOfErrors', 'errors'
        ]);
        assert.equal(errorSummary.totalOfErrors, 0);
        assert.lengthOf(errorSummary.errors, 0);
      } else {
        console.log('errorSummary: %s', JSON.stringify(loggingStore.errorSummary, null, 2));
      }

      var totalOfExit = unhook();
      assert.equal(totalOfExit, 0);
    });

    after(function() {
      LogTracer.clearStringifyInterceptors();
      issueInspector.reset();
    });
  });

  after(function() {
    envmask.reset();
  });
});
