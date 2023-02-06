"use strict";

const lab = require("../index");
const Devebot = lab.getFramework();
const Promise = Devebot.require("bluebird");
const chores = Devebot.require("chores");
const lodash = Devebot.require("lodash");
const loader = Devebot.require("loader");
const assert = require("chai").assert;
const LogConfig = Devebot.require("logolite").LogConfig;
const LogTracer = Devebot.require("logolite").LogTracer;
const envcloak = require("envcloak").instance;

const constx = require(lab.getFrameworkModule("utils/constx"));
const FRAMEWORK_PACKAGE_NAME = constx.FRAMEWORK.PACKAGE_NAME;

describe("tdd:lib:core:runhook-manager", function() {
  this.timeout(lab.getDefaultTimeout());

  let issueInspector = lab.getIssueInspector();

  before(function() {
    envcloak.setup({
      NODE_ENV: "test",
      LOGOLITE_FULL_LOG_MODE: "false",
      LOGOLITE_ALWAYS_ENABLED: "all",
      LOGOLITE_ALWAYS_MUTED: "all"
    });
    LogConfig.reset();
    issueInspector.reset();
  });

  describe("definition", function() {
    let loggingStore = {};

    before(function() {
      LogTracer.setupDefaultInterceptors([{
        accumulator: loggingStore,
        mappings: [{
          allTags: [ chores.toFullname(FRAMEWORK_PACKAGE_NAME, "runhookManager"), "definition" ],
          storeTo: "definition"
        }]
      }]);
    });

    beforeEach(function() {
      LogTracer.reset().empty(loggingStore);
    });

    it("load all of command definitions from routines", function() {
      let runhookManager = lab.createRunhookManager("fullapp");
      let commands = lab.simplifyCommands(runhookManager.getDefinitions());
      false && console.info(JSON.stringify(commands, null, 2));
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
          "package": FRAMEWORK_PACKAGE_NAME,
          "name": "applica-info",
          "alias": "app-info",
          "description": "[String]",
          "options": []
        },
        {
          "package": FRAMEWORK_PACKAGE_NAME,
          "name": "logger-info",
          "alias": "log-info",
          "description": "[String]",
          "options": []
        },
        {
          "package": FRAMEWORK_PACKAGE_NAME,
          "name": "logger-reset",
          "alias": "log-reset",
          "description": "[String]",
          "options": []
        },
        {
          "package": FRAMEWORK_PACKAGE_NAME,
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
          "package": FRAMEWORK_PACKAGE_NAME,
          "name": "sandbox-info",
          "alias": "sb-info",
          "description": "[String]",
          "options": []
        },
        {
          "package": FRAMEWORK_PACKAGE_NAME,
          "name": "system-info",
          "alias": "sys-info",
          "description": "[String]",
          "options": []
        }
      ]);
    });

    it("check command is available correctly", function() {
      let runhookManager = lab.createRunhookManager("fullapp");
      assert.isFalse(runhookManager.isAvailable({ name: "main-cmd0" }));
      assert.isFalse(runhookManager.isAvailable({ name: "main-cmd0", package: "fullapp" }));

      assert.isTrue(runhookManager.isAvailable({ name: "main-cmd1" }));
      assert.isTrue(runhookManager.isAvailable({ name: "main-cmd1", package: "fullapp" }));
      assert.isTrue(runhookManager.isAvailable({ name: "main-cmd2" }));
      assert.isTrue(runhookManager.isAvailable({ name: "main-cmd2", package: "fullapp" }));
      assert.isTrue(runhookManager.isAvailable({ name: "plugin1-routine1", package: "plugin1" }));
      assert.isTrue(runhookManager.isAvailable({ name: "plugin2-routine3", package: "plugin2" }));
      assert.isTrue(runhookManager.isAvailable({ name: "plugin3-routine3", package: "plugin3" }));
      assert.isTrue(runhookManager.isAvailable({ name: "applica-info" }));
      assert.isTrue(runhookManager.isAvailable({ name: "system-info", package: FRAMEWORK_PACKAGE_NAME }));

      assert.isFalse(runhookManager.isAvailable({ name: "routine0" }));
      assert.isTrue(runhookManager.isAvailable({ name: "routine0", package: "sub-plugin1" }));
      assert.isTrue(runhookManager.isAvailable({ name: "routine0", package: "sub-plugin2" }));
      assert.isTrue(runhookManager.isAvailable({ name: "routine1" }));
      assert.isTrue(runhookManager.isAvailable({ name: "routine2" }));
    });

    it("retrieve the unique named routine with or without suggested package", function() {
      let runhookManager = lab.createRunhookManager("fullapp");

      let runhook1 = runhookManager.getRunhook({ name: "routine1" });
      assert.isFunction(runhook1.handler);

      let runhook1_1 = runhookManager.getRunhook({ name: "routine1", package: "sub-routine1" });
      assert.equal(runhook1_1, runhook1);

      let runhook1_2 = runhookManager.getRunhook({ name: "routine1", package: "sub-routine2" });
      assert.equal(runhook1_2, runhook1);

      let runhook2 = runhookManager.getRunhook({ name: "routine2" });
      assert.isFunction(runhook2.handler);

      let runhook2_1 = runhookManager.getRunhook({ name: "routine2", package: "sub-routine1" });
      assert.equal(runhook2_1, runhook2);

      let runhook2_2 = runhookManager.getRunhook({ name: "routine2", package: "sub-routine2" });
      assert.equal(runhook2_2, runhook2);

      assert.notEqual(runhook1, runhook2);
      assert.notEqual(runhook1.handler, runhook2.handler);
    });

    it("retrieve the same named routines from different packages", function() {
      let runhookManager = lab.createRunhookManager("fullapp");

      let runhook0_1 = runhookManager.getRunhook({ name: "routine0", package: "sub-plugin1" });
      assert.isFunction(runhook0_1.handler);

      let runhook0_2 = runhookManager.getRunhook({ name: "routine0", package: "sub-plugin2" });
      assert.isFunction(runhook0_2.handler);

      assert.notEqual(runhook0_1, runhook0_2);
      assert.notEqual(runhook0_1.handler, runhook0_2.handler);
    });

    after(function() {
      LogTracer.clearInterceptors();
    });
  });

  after(function() {
    envcloak.reset();
    issueInspector.reset();
  });
});
