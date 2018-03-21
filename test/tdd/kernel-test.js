'use strict';

var lab = require('../index');
var Devebot = lab.getDevebot();
var Promise = Devebot.require('bluebird');
var chores = Devebot.require('chores');
var lodash = Devebot.require('lodash');
var loader = Devebot.require('loader');
var debugx = Devebot.require('pinbug')('tdd:devebot:base:kernel');
var assert = require('chai').assert;
var path = require('path');
var util = require('util');
var kernel = require('../../lib/kernel');
var LogConfig = require('logolite').LogConfig;
var LogTracer = require('logolite').LogTracer;
var envtool = require('logolite/envtool');
var rewire = require('rewire');
var sinon = require('sinon');
var errorHandlerPath = path.join(lab.getDevebotHome(), 'lib/backbone/error-handler');
var errorHandler = require(errorHandlerPath).instance;

describe('tdd:devebot:base:kernel', function() {
  this.timeout(lab.getDefaultTimeout());

  before(function() {
    envtool.setup({
      NODE_ENV: 'test',
      LOGOLITE_ALWAYS_ENABLED: 'all',
      LOGOLITE_ALWAYS_MUTED: 'all',
      DEVEBOT_FORCING_SILENT: 'error-handler'
    });
    LogConfig.reset();
    errorHandler.reset();
  });

  describe('validateBridgeConfig()', function() {
    var validateBridgeConfig = rewire('../../lib/kernel').__get__('validateBridgeConfig');
    var {loggingFactory, schemaValidator} = lab.createBasicServices('fullapp');
    var LX = loggingFactory.getLogger();
    var LT = loggingFactory.getTracer();
    // var bridgeLoader = { loadMetadata: function() {} };
    // sinon.stub(bridgeLoader, 'loadMetadata').callsFake(function(bridgeMetadata) {
    //   lodash.assign(bridgeMetadata, {});
    // });

    it("result should be ok if bridge config is valid with bridge schema", function() {
      var result = [];
      validateBridgeConfig({LX, LT, schemaValidator}, {
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
      assert.sameDeepMembers(result, [
        {
          "stage": "bridge/schema",
          "name": "application/connector1#wrapper",
          "type": "bridge",
          "hasError": false
        },
        {
          "stage": "bridge/schema",
          "name": "application/connector2#wrapper",
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
          allTags: [ 'devebot/kernel', 'validate-bridge-by-schema' ],
          storeTo: 'bridgeValidation'
        }, {
          allTags: [ 'devebot/kernel', 'config-schema-loading' ],
          storeTo: 'schemaValidation'
        }, {
          allTags: [ 'devebot/kernel', 'config-schema-synchronizing' ],
          storeTo: 'pluginValidation'
        }, {
          allTags: [ 'devebot/kernel', 'config-schema-validating' ],
          storeTo: 'outputValidation'
        }, {
          allTags: [ 'devebot/errorHandler', 'examine' ],
          matchingField: 'invoker',
          matchingRule: 'devebot/kernel',
          storeTo: 'errorSummary'
        }]
      }]);
    });

    beforeEach(function() {
      LogTracer.reset().empty(loggingStore);
    });

    it('kernel constructor is ok if no error has occurred in validating', function() {
      var unhook = lab.preventExit();

      var kernel = lab.createKernel('fullapp');

      var schemaMap = lodash.get(loggingStore, 'schemaValidation.0.schemaMap', {});
      false && console.log('Schema: %s', JSON.stringify(schemaMap, null, 2));

      var configObject = lodash.get(loggingStore, 'pluginValidation.0.configObject', {});
      var configSchema = lodash.get(loggingStore, 'pluginValidation.0.configSchema', {});
      false && console.log('configObject: %s', JSON.stringify(configObject, null, 2));
      false && console.log('configSchema: %s', JSON.stringify(configSchema, null, 2));

      var result = lodash.get(loggingStore, 'outputValidation.0.validatingResult', []);
      false && lodash.forEach(result, function(item) {
        console.log('- validation result: %s', JSON.stringify(lodash.omit(item, ['stack'])));
        if (item.hasError) {
          console.log('  - stack:\n%s', item.stack);
        }
      });

      var expectedBridges = {
        "__status__": true,
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
      
      if (chores.isOldFeatures()) {
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

      assert.deepInclude(configObject.sandbox, {
        "application": {
          "host": "0.0.0.0",
          "port": 17700,
          "verbose": false
        },
        "bridges": expectedBridges,
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
      assert.deepEqual(configSchema.sandbox, {
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
            }
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
            }
          }
        }
      });

      // errorSummary.0 <= configLoader, errorSummary.1 <= kernel
      false && console.log('errorSummary: %s', JSON.stringify(loggingStore.errorSummary, null, 2));
      assert.lengthOf(lodash.get(loggingStore, 'errorSummary', []), 1);
      var errorSummary = lodash.pick(lodash.get(loggingStore, 'errorSummary.0', {}), [
        'totalOfErrors', 'errors'
      ]);
      assert.deepEqual(errorSummary, { totalOfErrors: 0, errors: [] });

      var totalOfExit = unhook();
      assert.equal(totalOfExit, 0);
    });

    it("loading an invalid plugin's configuration make program exit", function() {
      var unhook = lab.preventExit();
      var kernel = lab.createKernel('invalid-schema');

      // errorSummary.0 <= configLoader, errorSummary.1 <= kernel
      false && console.log('errorSummary: %s', JSON.stringify(loggingStore.errorSummary, null, 2));
      assert.lengthOf(lodash.get(loggingStore, 'errorSummary', []), 1);
      var errorSummary = lodash.pick(lodash.get(loggingStore, 'errorSummary.0', {}), [
        'totalOfErrors', 'errors'
      ]);
      assert.equal(errorSummary.totalOfErrors, 2);

      var totalOfExit = unhook();
      assert.equal(totalOfExit, 1);
    });

    after(function() {
      LogTracer.clearStringifyInterceptors();
    });
  });

  after(function() {
    envtool.reset();
    errorHandler.reset();
  });
});
