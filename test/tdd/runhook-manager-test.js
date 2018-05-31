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
var errorHandler = require('../../lib/backbone/error-handler').instance;

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
          "package": "application",
          "name": "main-cmd1",
          "description": "[String]",
          "options": []
        },
        {
          "package": "application",
          "name": "main-cmd2",
          "description": "[String]",
          "options": []
        },
        {
          "package": "sub-plugin1",
          "name": "routine0",
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
          "package": "sub-plugin1",
          "name": "routine1",
          "description": "[String]",
          "options": []
        },
        {
          "package": "sub-plugin2",
          "name": "routine0",
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
          "package": "sub-plugin2",
          "name": "routine2",
          "description": "[String]",
          "validate": "[Function]",
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

    it('check command is available correctly', function() {
      var runhookManager = lab.createRunhookManager('fullapp');
      assert.isFalse(runhookManager.isAvailable({ name: 'main-cmd0' }));
      assert.isFalse(runhookManager.isAvailable({ name: 'main-cmd0', package: 'fullapp' }));

      assert.isTrue(runhookManager.isAvailable({ name: 'main-cmd1' }));
      assert.isTrue(runhookManager.isAvailable({ name: 'main-cmd1', package: 'fullapp' }));
      assert.isTrue(runhookManager.isAvailable({ name: 'main-cmd2' }));
      assert.isTrue(runhookManager.isAvailable({ name: 'main-cmd2', package: 'fullapp' }));
      assert.isTrue(runhookManager.isAvailable({ name: 'plugin1-routine1', package: 'plugin1' }));
      assert.isTrue(runhookManager.isAvailable({ name: 'plugin2-routine3', package: 'plugin2' }));
      assert.isTrue(runhookManager.isAvailable({ name: 'plugin3-routine3', package: 'plugin3' }));
      assert.isTrue(runhookManager.isAvailable({ name: 'applica-info' }));
      assert.isTrue(runhookManager.isAvailable({ name: 'system-info', package: 'devebot' }));

      assert.isFalse(runhookManager.isAvailable({ name: 'routine0' }));
      assert.isTrue(runhookManager.isAvailable({ name: 'routine0', package: 'sub-plugin1' }));
      assert.isTrue(runhookManager.isAvailable({ name: 'routine0', package: 'sub-plugin2' }));
      assert.isTrue(runhookManager.isAvailable({ name: 'routine1' }));
      assert.isTrue(runhookManager.isAvailable({ name: 'routine2' }));
    });

    it('retrieve the unique named routine with/without suggested package', function() {
      var runhookManager = lab.createRunhookManager('fullapp');

      var runhook1 = runhookManager.getRunhook({ name: 'routine1' });
      assert.isFunction(runhook1.handler);

      var runhook1_1 = runhookManager.getRunhook({ name: 'routine1', package: 'sub-routine1' });
      assert.equal(runhook1_1, runhook1);

      var runhook1_2 = runhookManager.getRunhook({ name: 'routine1', package: 'sub-routine2' });
      assert.equal(runhook1_2, runhook1);

      var runhook2 = runhookManager.getRunhook({ name: 'routine2' });
      assert.isFunction(runhook2.handler);

      var runhook2_1 = runhookManager.getRunhook({ name: 'routine2', package: 'sub-routine1' });
      assert.equal(runhook2_1, runhook2);

      var runhook2_2 = runhookManager.getRunhook({ name: 'routine2', package: 'sub-routine2' });
      assert.equal(runhook2_2, runhook2);

      assert.notEqual(runhook1, runhook2);
    });

    it('retrieve the same named routines from different packages', function() {
      var runhookManager = lab.createRunhookManager('fullapp');

      var runhook0_1 = runhookManager.getRunhook({ name: 'routine0', package: 'sub-plugin1' });
      assert.isFunction(runhook0_1.handler);

      var runhook0_2 = runhookManager.getRunhook({ name: 'routine0', package: 'sub-plugin2' });
      assert.isFunction(runhook0_2.handler);

      assert.notEqual(runhook0_1, runhook0_2);
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
