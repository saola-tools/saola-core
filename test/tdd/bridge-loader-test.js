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
var errorHandler = require(path.join(lab.getDevebotHome(), 'lib/backbone/error-handler')).instance;

describe('tdd:devebot:core:bridge-loader', function() {
  this.timeout(lab.getDefaultTimeout());
  
  before(function() {
    envtool.setup({
      LOGOLITE_ALWAYS_ENABLED: 'all',
      LOGOLITE_ALWAYS_MUTED: 'all'
		});
		LogConfig.reset();
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
      assert.deepInclude(dialectMap, {
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
          "moduleId": "bridge1",
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
          "moduleId": "bridge1",
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
          "moduleId": "bridge2",
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
          "moduleId": "bridge3",
          "name": "anyname3a"
        }
      });
    });
  });

  after(function() {
		LogTracer.clearStringifyInterceptors();
		envtool.reset();
	});
});
