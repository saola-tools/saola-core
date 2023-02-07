"use strict";

const lab = require("../index");
const FRWK = lab.getFramework();
const chores = FRWK.require("chores");
const lodash = FRWK.require("lodash");
const assert = require("chai").assert;
const LogConfig = FRWK.require("logolite").LogConfig;
const LogTracer = FRWK.require("logolite").LogTracer;
const envcloak = require("envcloak").instance;

const constx = require(lab.getFrameworkModule("utils/constx"));
const FRAMEWORK_PACKAGE_NAME = constx.FRAMEWORK.PACKAGE_NAME;

describe("bdd:app:loading-invalid-modules", function() {
  this.timeout(lab.getDefaultTimeout());

  let issueInspector = lab.getIssueInspector();

  before(function() {
    envcloak.setup({
      LOGOLITE_FULL_LOG_MODE: "false",
      LOGOLITE_ALWAYS_ENABLED: "all",
      LOGOLITE_ALWAYS_MUTED: "all",
      DEVEBOT_FORCING_SILENT: "issue-inspector",
      DEVEBOT_NODE_ENV: "test",
    });
    LogConfig.reset();
    issueInspector.reset();
  });

  after(function() {
    envcloak.reset();
    issueInspector.reset();
    chores.clearCache();
  });

  describe("not-found-packages", function() {
    let loggingStore = {};

    before(function() {
      LogTracer.setupDefaultInterceptors([{
        accumulator: loggingStore,
        mappings: [{
          allTags: [ chores.toFullname(FRAMEWORK_PACKAGE_NAME, "issueInspector"), "examine" ],
          matchingField: "invoker",
          matchingRule: chores.toFullname(FRAMEWORK_PACKAGE_NAME, "bootstrap"),
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
      let unhook = lab.preventExit({ throwException: true });

      assert.throws(function() {
        lab.getApp("not-found-packages");
      }, lab.ProcessExitError);

      if (true) {
        assert.lengthOf(lodash.get(loggingStore, "errorSummary", []), 1);
        let errorSummary = lodash.pick(lodash.get(loggingStore, "errorSummary.0", {}), [
          "totalOfErrors", "errors"
        ]);
        assert.equal(errorSummary.totalOfErrors, 2);
        let errs = lodash.map(errorSummary.errors, function(err) {
          return lodash.pick(err, ["stage", "type", "name"]);
        });
        false && console.info(JSON.stringify(errs, null, 2));
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
        console.info("errorSummary: %s", JSON.stringify(loggingStore.errorSummary, null, 2));
      }

      let totalOfExit = unhook();
      assert.equal(totalOfExit, 1);
    });

    after(function() {
      LogTracer.clearInterceptors();
    });
  });

  describe("invalid-bridge-modules", function() {
    let loggingStore = {};

    before(function() {
      LogTracer.setupDefaultInterceptors([{
        accumulator: loggingStore,
        mappings: [{
          allTags: [ chores.toFullname(FRAMEWORK_PACKAGE_NAME, "issueInspector"), "examine", "sandbox-loading" ],
          matchingField: "invoker",
          matchingRule: chores.toFullname(FRAMEWORK_PACKAGE_NAME, "kernel"),
          storeTo: "errorSummary"
        }]
      }]);
    });

    beforeEach(function() {
      LogTracer.reset().empty(loggingStore);
      issueInspector.reset();
    });

    it("loading invalid-bridge-booter will be failed", function() {
      let unhook = lab.preventExit();
      let app = lab.getApp("invalid-bridge-booter");
      assert.isNotNull(app.server);

      if (true) {
        assert.lengthOf(lodash.get(loggingStore, "errorSummary", []), 1);
        let errorSummary = lodash.pick(lodash.get(loggingStore, "errorSummary.0", {}), [
          "totalOfErrors", "errors"
        ]);
        // BridgeLoader.loadMetadata() & BridgeLoader.loadDialects()
        let expectedTotalOfErrors = 2;
        if (!chores.isUpgradeSupported("metadata-refiner")) {
          expectedTotalOfErrors = 1;
        }
        assert.equal(errorSummary.totalOfErrors, expectedTotalOfErrors);
      } else {
        console.info("errorSummary: %s", JSON.stringify(loggingStore.errorSummary, null, 2));
      }

      let totalOfExit = unhook();
      let expectedTotalOfExits = 2;
      if (!chores.isUpgradeSupported("metadata-refiner")) {
        expectedTotalOfExits = 1;
      }
      assert.equal(totalOfExit, expectedTotalOfExits);
    });

    it("loading invalid-bridge-dialect will be failed", function() {
      let unhook = lab.preventExit();
      let app = lab.getApp("invalid-bridge-dialect");
      assert.isNotNull(app.server);

      if (true) {
        assert.lengthOf(lodash.get(loggingStore, "errorSummary", []), 1);
        let errorSummary = lodash.pick(lodash.get(loggingStore, "errorSummary.0", {}), [
          "totalOfErrors", "errors"
        ]);
        assert.equal(errorSummary.totalOfErrors, 1);
      } else {
        console.info("errorSummary: %s", JSON.stringify(loggingStore.errorSummary, null, 2));
      }

      let totalOfExit = unhook();
      assert.equal(totalOfExit, 1);
    });

    after(function() {
      LogTracer.clearInterceptors();
    });
  });

  describe("invalid-plugin-modules", function() {
    let loggingStore = {};

    before(function() {
      LogTracer.setupDefaultInterceptors([{
        accumulator: loggingStore,
        mappings: [{
          allTags: [ chores.toFullname(FRAMEWORK_PACKAGE_NAME, "issueInspector"), "examine", "sandbox-loading" ],
          matchingField: "invoker",
          matchingRule: chores.toFullname(FRAMEWORK_PACKAGE_NAME, "kernel"),
          storeTo: "errorSummary"
        }]
      }]);
    });

    beforeEach(function() {
      LogTracer.reset().empty(loggingStore);
      issueInspector.reset();
    });

    it("loading invalid-plugin-booter will be failed", function() {
      let unhook = lab.preventExit();
      let app = lab.getApp("invalid-plugin-booter");
      assert.isNotNull(app.server);

      if (true) {
        assert.lengthOf(lodash.get(loggingStore, "errorSummary", []), 1);
        let errorSummary = lodash.pick(lodash.get(loggingStore, "errorSummary.0", {}), [
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
        console.info("errorSummary: %s", JSON.stringify(loggingStore.errorSummary, null, 2));
      }

      let totalOfExit = unhook();
      assert.equal(totalOfExit, 1);
    });

    it("loading invalid-plugin-service will be failed", function() {
      let unhook = lab.preventExit();
      let app = lab.getApp("invalid-plugin-service");
      assert.isNotNull(app.server);

      if (true) {
        assert.lengthOf(lodash.get(loggingStore, "errorSummary", []), 1);
        let errorSummary = lodash.pick(lodash.get(loggingStore, "errorSummary.0", {}), [
          "totalOfErrors", "errors"
        ]);
        assert.equal(errorSummary.totalOfErrors, 1);
      } else {
        console.info("errorSummary: %s", JSON.stringify(loggingStore.errorSummary, null, 2));
      }

      let totalOfExit = unhook();
      assert.equal(totalOfExit, 1);
    });

    it("loading invalid-plugin-trigger will be failed", function() {
      let unhook = lab.preventExit();
      let app = lab.getApp("invalid-plugin-trigger");
      assert.isNotNull(app.server);

      if (true) {
        assert.lengthOf(lodash.get(loggingStore, "errorSummary", []), 1);
        let errorSummary = lodash.pick(lodash.get(loggingStore, "errorSummary.0", {}), [
          "totalOfErrors", "errors"
        ]);
        assert.equal(errorSummary.totalOfErrors, 1);
      } else {
        console.info("errorSummary: %s", JSON.stringify(loggingStore.errorSummary, null, 2));
      }

      let totalOfExit = unhook();
      assert.equal(totalOfExit, 1);
    });

    it("loading invalid-plugin-trigger-methods will be failed", function() {
      let unhook = lab.preventExit();
      let app = lab.getApp("invalid-plugin-trigger-methods");
      assert.isNotNull(app.server);

      if (true) {
        assert.lengthOf(lodash.get(loggingStore, "errorSummary", []), 1);
        let errorSummary = lodash.pick(lodash.get(loggingStore, "errorSummary.0", {}), [
          "totalOfErrors", "errors"
        ]);
        assert.equal(errorSummary.totalOfErrors, 3);
        assert.deepEqual(lodash.map(errorSummary.errors, "name"), [
          chores.toFullname("plugin-invalid-trigger-methods", "trigger1"),
          chores.toFullname("plugin-invalid-trigger-methods", "trigger2"),
          chores.toFullname("plugin-invalid-trigger-methods", "trigger3")
        ]);
      } else {
        console.info("errorSummary: %s", JSON.stringify(loggingStore.errorSummary, null, 2));
      }

      let totalOfExit = unhook();
      assert.equal(totalOfExit, 1);
    });

    after(function() {
      LogTracer.clearInterceptors();
    });
  });
});
