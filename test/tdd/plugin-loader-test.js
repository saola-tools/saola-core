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

  describe('loadchemas()', function() {
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

  after(function() {
		LogTracer.clearStringifyInterceptors();
		envtool.reset();
	});
});