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

var createPluginLoader = function() {
  var injektor = new Injektor({ separator: chores.getSeparator() });
  lodash.forOwn(chores.loadServiceByNames({}, path.join(lab.getDevebotHome(), 'lib/backbone'), [
    'plugin-loader', 'schema-validator', 'logging-factory'
  ]), function(constructor, serviceName) {
    injektor.defineService(serviceName, constructor, chores.injektorContext);
  });
  injektor.registerObject('profileConfig', {
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
  });
  var pluginRefs = [{
    type: "application",
    name: "fullapp",
    path: require.resolve(lab.getAppHome('fullapp'))
  }, {
    name: 'sublib1',
    path: require.resolve(lab.getLibHome('sublib1'))
  }, {
    name: 'sublib2',
    path: require.resolve(lab.getLibHome('sublib2'))
  }];
  var app = lab.getApp('fullapp');
  injektor.registerObject('pluginRefs', app.config.pluginRefs);
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
    it('load all of valid schemas in all components', function() {
      var pluginLoader = createPluginLoader();
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
        "sublib1/sandbox": {
          "default": {
            "moduleId": "sublib1",
            "pluginName": "sublib1",
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
        "sublib2/sandbox": {
          "default": {
            "moduleId": "sublib2",
            "pluginName": "sublib2",
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