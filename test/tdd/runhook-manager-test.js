'use strict';

var lab = require('../index');
var Devebot = lab.getDevebot();
var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');
var loader = Devebot.require('loader');
var debugx = Devebot.require('pinbug')('tdd:devebot:core:runhook-manager');
var assert = require('chai').assert;
var path = require('path');
var util = require('util');
var LogConfig = require('logolite').LogConfig;
var LogTracer = require('logolite').LogTracer;
var envtool = require('logolite/envtool');
var errorHandlerPath = path.join(lab.getDevebotHome(), 'lib/backbone/error-handler');
var errorHandler = require(errorHandlerPath).instance;

describe('tdd:devebot:core:runhook-manager', function() {
  this.timeout(lab.getDefaultTimeout());

  before(function() {
    envtool.setup({
      NODE_ENV: 'test',
      LOGOLITE_ALWAYS_ENABLED: 'all',
      LOGOLITE_ALWAYS_MUTED: 'all'
    });
    LogConfig.reset();
    errorHandler.reset();
  });

  describe('definition', function() {
    var loggingStore = {};

    before(function() {
      LogTracer.setupDefaultInterceptors([{
        accumulator: loggingStore,
        mappings: [{
          allTags: [ 'devebot/runhookManager', 'definition' ],
          storeTo: 'definition'
        }]
      }]);
    });

    beforeEach(function() {
      LogTracer.reset().empty(loggingStore);
    });

    it('load all of command definitions from routines', function() {
      var runhookManager = lab.createRunhookManager('fullapp');
      var commands = lab.simplifyCommands(runhookManager.getDefinitions());
      false && console.log(JSON.stringify(commands, null, 2));
      assert.sameDeepMembers(commands, [
        {
          "package": "fullapp",
          "name": "main-cmd1",
          "description": "[String]",
          "options": []
        },
        {
          "package": "fullapp",
          "name": "main-cmd2",
          "description": "[String]",
          "options": []
        },
        {
          "package": "plugin1",
          "name": "plugin1-routine1",
          "description": "[String]",
          "options": []
        },
        {
          "package": "plugin1",
          "name": "plugin1-routine2",
          "description": "[String]",
          "options": []
        },
        {
          "package": "plugin2",
          "name": "plugin2-routine1",
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
        {
          "package": "plugin2",
          "name": "plugin2-routine3",
          "description": "[String]",
          "validate": "[Function]",
          "options": []
        },
        {
          "package": "plugin3",
          "name": "plugin3-routine1",
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
        {
          "package": "plugin3",
          "name": "plugin3-routine3",
          "description": "[String]",
          "validate": "[Function]",
          "options": []
        },
        {
          "package": "devebot",
          "name": "applica-info",
          "alias": "app-info",
          "description": "[String]",
          "options": []
        },
        {
          "package": "devebot",
          "name": "logger-info",
          "alias": "log-info",
          "description": "[String]",
          "options": []
        },
        {
          "package": "devebot",
          "name": "logger-reset",
          "alias": "log-reset",
          "description": "[String]",
          "options": []
        },
        {
          "package": "devebot",
          "name": "logger-set",
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
        {
          "package": "devebot",
          "name": "sandbox-info",
          "alias": "sb-info",
          "description": "[String]",
          "options": []
        },
        {
          "package": "devebot",
          "name": "system-info",
          "alias": "sys-info",
          "description": "[String]",
          "options": []
        }
      ]);
    });

    it.skip('check command is available correctly', function() {
      var runhookManager = lab.createRunhookManager('fullapp');
      assert.isFalse(runhookManager.isAvailable({ name: 'main-cmd0' }));
      assert.isFalse(runhookManager.isAvailable({ name: 'main-cmd0', package: 'fullapp' }));
      assert.isTrue(runhookManager.isAvailable({ name: 'main-cmd1' }));
      assert.isTrue(runhookManager.isAvailable({ name: 'main-cmd1', package: 'fullapp' }));
      assert.isTrue(runhookManager.isAvailable({ name: 'main-cmd2' }));
      assert.isTrue(runhookManager.isAvailable({ name: 'main-cmd2', package: 'fullapp' }));
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
