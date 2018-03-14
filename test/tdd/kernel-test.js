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

  describe('validate config/schemas', function() {
    var loggingStore = {};

    before(function() {
      LogTracer.setupDefaultInterceptors([{
        accumulator: loggingStore,
        mappings: [{
          allTags: [ 'devebot/kernel', 'config-schema-loading' ],
          storeTo: 'schemaValidation'
        }, {
          allTags: [ 'devebot/kernel', 'config-schema-synchronizing' ],
          storeTo: 'schemaValidation'
        }, {
          allTags: [ 'devebot/kernel', 'config-schema-validating' ],
          storeTo: 'schemaValidation'
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

      var configMap = lodash.get(loggingStore, 'schemaValidation.0.configMap', {});
      var schemaMap = lodash.get(loggingStore, 'schemaValidation.0.schemaMap', {});
      false && console.log('Config: %s', JSON.stringify(configMap, null, 2));
      false && console.log('Schema: %s', JSON.stringify(schemaMap, null, 2));

      var configObject = lodash.get(loggingStore, 'schemaValidation.1.configObject', {});
      var configSchema = lodash.get(loggingStore, 'schemaValidation.1.configSchema', {});
      false && console.log('configObject: %s', JSON.stringify(configObject, null, 2));
      false && console.log('configSchema: %s', JSON.stringify(configSchema, null, 2));

      var result = lodash.get(loggingStore, 'schemaValidation.2.validatingResult', []);
      false && lodash.forEach(result, function(item) {
        console.log('- validation result: %s', JSON.stringify(lodash.omit(item, ['stack'])));
        if (item.hasError) {
          console.log('  - stack:\n%s', item.stack);
        }
      });

      assert.deepEqual(configObject.sandbox, {
        "application": {
          "host": "0.0.0.0",
          "port": 17700,
          "verbose": false
        },
        "bridges": {
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
      assert.deepEqual(configSchema.sandbox, {
        "application": {
          "moduleId": "fullapp",
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
            "moduleId": "sub-plugin1",
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
            "moduleId": "sub-plugin2",
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

    it('loading an invalid profile configure application make program exit');

    it('loading an invalid sandbox configure application make program exit', function() {
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
