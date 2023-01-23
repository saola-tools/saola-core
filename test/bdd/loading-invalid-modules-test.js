"use strict";

var lab = require("../index");
var Devebot = lab.getDevebot();
var chores = Devebot.require("chores");
var lodash = Devebot.require("lodash");
var assert = require("chai").assert;
var LogConfig = Devebot.require("logolite").LogConfig;
var LogTracer = Devebot.require("logolite").LogTracer;
var envcloak = require("envcloak").instance;

var constx = require("../../lib/utils/constx");

describe("bdd:devebot:loading-invalid-modules", function() {
  this.timeout(lab.getDefaultTimeout());

  var issueInspector = lab.getIssueInspector();

  before(function() {
    envcloak.setup({
      NODE_ENV: "test",
      LOGOLITE_FULL_LOG_MODE: "false",
      LOGOLITE_ALWAYS_ENABLED: "all",
      LOGOLITE_ALWAYS_MUTED: "all",
      DEVEBOT_FORCING_SILENT: "issue-inspector"
    });
    LogConfig.reset();
    issueInspector.reset();
  });

  describe("not-found-packages", function() {
    var loggingStore = {};

    before(function() {
      LogTracer.setupDefaultInterceptors([{
        accumulator: loggingStore,
        mappings: [{
          allTags: [ chores.toFullname(constx.FRAMEWORK.NAME, "issueInspector"), "examine" ],
          matchingField: "invoker",
          matchingRule: chores.toFullname(constx.FRAMEWORK.NAME, "bootstrap"),
          storeTo: "errorSummary"
        }]
      }]);
    });

    beforeEach(function() {
      LogTracer.reset().empty(loggingStore);
      issueInspector.reset();
      chores.clearCache();
    });

    it("loading application with not found packages will be failed", function() {
      var unhook = lab.preventExit({ throwException: true });

      assert.throws(function() {
        var app = lab.getApp("not-found-packages");
      }, lab.ProcessExitError);

      if (true) {
        assert.lengthOf(lodash.get(loggingStore, "errorSummary", []), 1);
        var errorSummary = lodash.pick(lodash.get(loggingStore, "errorSummary.0", {}), [
          "totalOfErrors", "errors"
        ]);
        assert.equal(errorSummary.totalOfErrors, 2);
        var errs = lodash.map(errorSummary.errors, function(err) {
          return lodash.pick(err, ["stage", "type", "name"]);
        });
        false && console.log(JSON.stringify(errs, null, 2));
        assert.sameDeepMembers(errs, [
          {
            "stage": "bootstrap",
            "type": "bridge",
            "name": "not-found-bridge"
          },
          {
            "stage": "bootstrap",
            "type": "plugin",
            "name": "not-found-plugin"
          }
        ]);
      } else {
        console.log("errorSummary: %s", JSON.stringify(loggingStore.errorSummary, null, 2));
      }

      var totalOfExit = unhook();
      assert.equal(totalOfExit, 1);
    });

    after(function() {
      LogTracer.clearInterceptors();
    });
  });

  describe("invalid-bridge-modules", function() {
    var loggingStore = {};

    before(function() {
      LogTracer.setupDefaultInterceptors([{
        accumulator: loggingStore,
        mappings: [{
          allTags: [ chores.toFullname(constx.FRAMEWORK.NAME, "issueInspector"), "examine", "sandbox-loading" ],
          matchingField: "invoker",
          matchingRule: chores.toFullname(constx.FRAMEWORK.NAME, "kernel"),
          storeTo: "errorSummary"
        }]
      }]);
    });

    beforeEach(function() {
      LogTracer.reset().empty(loggingStore);
      issueInspector.reset();
    });

    it("loading invalid-bridge-booter will be failed", function() {
      var unhook = lab.preventExit();
      var app = lab.getApp("invalid-bridge-booter");
      app.server;

      if (true) {
        assert.lengthOf(lodash.get(loggingStore, "errorSummary", []), 1);
        var errorSummary = lodash.pick(lodash.get(loggingStore, "errorSummary.0", {}), [
          "totalOfErrors", "errors"
        ]);
        // BridgeLoader.loadMetadata() & BridgeLoader.loadDialects()
        var expectedTotalOfErrors = 2;
        if (!chores.isUpgradeSupported("metadata-refiner")) {
          expectedTotalOfErrors = 1;
        }
        assert.equal(errorSummary.totalOfErrors, expectedTotalOfErrors);
      } else {
        console.log("errorSummary: %s", JSON.stringify(loggingStore.errorSummary, null, 2));
      }

      var totalOfExit = unhook();
      var expectedTotalOfExits = 2;
      if (!chores.isUpgradeSupported("metadata-refiner")) {
        expectedTotalOfExits = 1;
      }
      assert.equal(totalOfExit, expectedTotalOfExits);
    });

    it("loading invalid-bridge-dialect will be failed", function() {
      var unhook = lab.preventExit();
      var app = lab.getApp("invalid-bridge-dialect");
      app.server;

      if (true) {
        assert.lengthOf(lodash.get(loggingStore, "errorSummary", []), 1);
        var errorSummary = lodash.pick(lodash.get(loggingStore, "errorSummary.0", {}), [
          "totalOfErrors", "errors"
        ]);
        assert.equal(errorSummary.totalOfErrors, 1);
      } else {
        console.log("errorSummary: %s", JSON.stringify(loggingStore.errorSummary, null, 2));
      }

      var totalOfExit = unhook();
      assert.equal(totalOfExit, 1);
    });

    after(function() {
      LogTracer.clearInterceptors();
    });
  });

  describe("invalid-plugin-modules", function() {
    var loggingStore = {};

    before(function() {
      LogTracer.setupDefaultInterceptors([{
        accumulator: loggingStore,
        mappings: [{
          allTags: [ chores.toFullname(constx.FRAMEWORK.NAME, "issueInspector"), "examine", "sandbox-loading" ],
          matchingField: "invoker",
          matchingRule: chores.toFullname(constx.FRAMEWORK.NAME, "kernel"),
          storeTo: "errorSummary"
        }]
      }]);
    });

    beforeEach(function() {
      LogTracer.reset().empty(loggingStore);
      issueInspector.reset();
    });

    it("loading invalid-plugin-booter will be failed", function() {
      var unhook = lab.preventExit();
      var app = lab.getApp("invalid-plugin-booter");
      app.server;

      if (true) {
        assert.lengthOf(lodash.get(loggingStore, "errorSummary", []), 1);
        var errorSummary = lodash.pick(lodash.get(loggingStore, "errorSummary.0", {}), [
          "totalOfErrors", "errors"
        ]);
        // -- examining in sandboxManager --
        // invalid-plugin-booter/main-cmd2,
        // invalid-plugin-booter/main-service,
        // invalid-plugin-booter/main-trigger,
        // plugin-invalid-booter/routine1,
        // plugin-invalid-booter/service,
        // plugin-invalid-booter/trigger
        assert.equal(errorSummary.totalOfErrors, 6);
      } else {
        console.log("errorSummary: %s", JSON.stringify(loggingStore.errorSummary, null, 2));
      }

      var totalOfExit = unhook();
      assert.equal(totalOfExit, 1);
    });

    it("loading invalid-plugin-service will be failed", function() {
      var unhook = lab.preventExit();
      var app = lab.getApp("invalid-plugin-service");
      app.server;

      if (true) {
        assert.lengthOf(lodash.get(loggingStore, "errorSummary", []), 1);
        var errorSummary = lodash.pick(lodash.get(loggingStore, "errorSummary.0", {}), [
          "totalOfErrors", "errors"
        ]);
        assert.equal(errorSummary.totalOfErrors, 1);
      } else {
        console.log("errorSummary: %s", JSON.stringify(loggingStore.errorSummary, null, 2));
      }

      var totalOfExit = unhook();
      assert.equal(totalOfExit, 1);
    });

    it("loading invalid-plugin-trigger will be failed", function() {
      var unhook = lab.preventExit();
      var app = lab.getApp("invalid-plugin-trigger");
      app.server;

      if (true) {
        assert.lengthOf(lodash.get(loggingStore, "errorSummary", []), 1);
        var errorSummary = lodash.pick(lodash.get(loggingStore, "errorSummary.0", {}), [
          "totalOfErrors", "errors"
        ]);
        assert.equal(errorSummary.totalOfErrors, 1);
      } else {
        console.log("errorSummary: %s", JSON.stringify(loggingStore.errorSummary, null, 2));
      }

      var totalOfExit = unhook();
      assert.equal(totalOfExit, 1);
    });

    it("loading invalid-plugin-trigger-methods will be failed", function() {
      var unhook = lab.preventExit();
      var app = lab.getApp("invalid-plugin-trigger-methods");
      app.server;

      if (true) {
        assert.lengthOf(lodash.get(loggingStore, "errorSummary", []), 1);
        var errorSummary = lodash.pick(lodash.get(loggingStore, "errorSummary.0", {}), [
          "totalOfErrors", "errors"
        ]);
        assert.equal(errorSummary.totalOfErrors, 3);
        assert.deepEqual(lodash.map(errorSummary.errors, "name"), [
          chores.toFullname("plugin-invalid-trigger-methods", "trigger1"),
          chores.toFullname("plugin-invalid-trigger-methods", "trigger2"),
          chores.toFullname("plugin-invalid-trigger-methods", "trigger3")
        ]);
      } else {
        console.log("errorSummary: %s", JSON.stringify(loggingStore.errorSummary, null, 2));
      }

      var totalOfExit = unhook();
      assert.equal(totalOfExit, 1);
    });

    after(function() {
      LogTracer.clearInterceptors();
    });
  });

  after(function() {
    envcloak.reset();
    issueInspector.reset();
    chores.clearCache();
  });
});
