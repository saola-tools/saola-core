'use strict';

var lab = require('../index');
var Devebot = lab.getDevebot();
var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');
var loader = Devebot.require('loader');
var chores = Devebot.require('chores');
var debugx = Devebot.require('pinbug')('tdd:devebot:core:plugin-loader');
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

var createPluginLoader = function(appName) {
  var profileConfig = {};
  var pluginRefs = [];
  if (appName) {
    var app = lab.getApp(appName);
    profileConfig = app.config.profile || {
      logger: {
        transports: {
          console: {
            type: 'console',
            level: 'debug',
            json: false,
            timestamp: true,
            colorize: true
          }
        }
      }
    }
    pluginRefs = app.config.pluginRefs;
  }
  var injektor = new Injektor({ separator: chores.getSeparator() });
  lodash.forOwn(chores.loadServiceByNames({}, path.join(lab.getDevebotHome(), 'lib/backbone'), [
    'plugin-loader', 'schema-validator', 'logging-factory'
  ]), function(constructor, serviceName) {
    injektor.defineService(serviceName, constructor, chores.injektorContext);
  });
  injektor.registerObject('profileConfig', profileConfig);
  injektor.registerObject('pluginRefs', pluginRefs);
  return injektor.lookup('pluginLoader');
}

describe('tdd:devebot:core:plugin-loader', function() {
  this.timeout(lab.getDefaultTimeout());

  before(function() {
    envtool.setup({
      LOGOLITE_ALWAYS_ENABLED: 'all',
      LOGOLITE_ALWAYS_MUTED: 'all'
		});
		LogConfig.reset();
  });

  describe('loadSchemas()', function() {
    it('load schemas from empty application', function() {
      var pluginLoader = createPluginLoader();
      var schemaMap = {};
      pluginLoader.loadSchemas(schemaMap);
      false && console.log('schemaMap: ', JSON.stringify(schemaMap, null, 2));
      assert.deepEqual(schemaMap, {});
    });
    it('load schemas from simplest application', function() {
      var pluginLoader = createPluginLoader('simple');
      var schemaMap = {};
      pluginLoader.loadSchemas(schemaMap);
      false && console.log('schemaMap: ', JSON.stringify(schemaMap, null, 2));
      assert.deepEqual(schemaMap, {});
    });
    it('load all of valid schemas in all components', function() {
      var pluginLoader = createPluginLoader('fullapp');
      var schemaMap = {};
      pluginLoader.loadSchemas(schemaMap);
      errorHandler.barrier({exitOnError: true});
      false && console.log('schemaMap: ', JSON.stringify(schemaMap, null, 2));
      assert.deepInclude(schemaMap, {
        "fullapp/sandbox": {
          "default": {
            "moduleId": "fullapp",
            "pluginName": "application",
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
              }
            }
          }
        },
        "sub-plugin1/sandbox": {
          "default": {
            "moduleId": "sub-plugin1",
            "pluginName": "subPlugin1",
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
            "moduleId": "sub-plugin2",
            "pluginName": "subPlugin2",
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
      });
    });
  });

  describe('loadServices()', function() {
    it('load services from empty application', function() {
      var pluginLoader = createPluginLoader();
      var serviceMap = {};
      pluginLoader.loadServices(serviceMap);
      false && console.log('serviceMap: ', JSON.stringify(serviceMap, null, 2));
      assert.deepEqual(serviceMap, {});
    });
    it('load services from simplest application', function() {
      var pluginLoader = createPluginLoader('simple');
      var serviceMap = {};
      pluginLoader.loadServices(serviceMap);
      false && console.log('serviceMap: ', JSON.stringify(serviceMap, null, 2));
      assert.deepEqual(serviceMap, {});
    });
    it('load all of valid services in all components', function() {
      var pluginLoader = createPluginLoader('fullapp');
      var originMap = {};
      pluginLoader.loadServices(originMap);
      errorHandler.barrier({exitOnError: true});
      false && console.log('serviceMap: ', util.inspect(originMap, { depth: 5 }));
      var serviceMap = lodash.mapValues(originMap, function(service) {
        return lodash.assign(lodash.pick(service, [
            'construktor.argumentProperties',
            'construktor.argumentSchema'
          ]), lodash.omit(service, ['construktor']));
      });
      true && console.log('serviceMap: ', JSON.stringify(serviceMap, null, 2));
      assert.deepInclude(serviceMap, {
        "fullapp/mainService": {
          "moduleId": "fullapp",
          "name": "mainService",
          "construktor": {
            "argumentSchema": {
              "$id": "mainService",
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
          }
        },
        "sub-plugin1/sublibService": {
          "moduleId": "sub-plugin1",
          "name": "sublibService",
          "construktor": {
            "argumentSchema": {
              "$id": "sublibService",
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
                },
                "sublibTrigger": {
                  "type": "object"
                }
              }
            }
          }
        },
        "sub-plugin2/sublibService": {
          "moduleId": "sub-plugin2",
          "name": "sublibService",
          "construktor": {
            "argumentProperties": [
              "sandboxName",
              "sandboxConfig",
              "profileName",
              "profileConfig",
              "loggingFactory",
              "sublibTrigger"
            ],
            "argumentSchema": {
              "$id": "sublibService",
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
                },
                "sublibTrigger": {
                  "type": "object"
                }
              }
            }
          }
        },
        "plugin1/plugin1Service": {
          "moduleId": "plugin1",
          "name": "plugin1Service",
          "construktor": {
            "argumentSchema": {
              "$id": "plugin1Service",
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
          }
        },
        "plugin2/plugin2Service": {
          "moduleId": "plugin2",
          "name": "plugin2Service",
          "construktor": {
            "argumentSchema": {
              "$id": "plugin2Service",
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
          }
        },
        "plugin3/plugin3Service": {
          "moduleId": "plugin3",
          "name": "plugin3Service",
          "construktor": {
            "argumentSchema": {
              "$id": "plugin3Service",
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
          }
        }
      });
    });
  });

  after(function() {
		LogTracer.clearStringifyInterceptors();
		envtool.reset();
	});
});