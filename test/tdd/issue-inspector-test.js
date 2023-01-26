"use strict";

const lab = require("../index");
const Devebot = lab.getDevebot();
const chores = Devebot.require("chores");
const assert = require("chai").assert;
const LogConfig = Devebot.require("logolite").LogConfig;
const LogTracer = Devebot.require("logolite").LogTracer;
const envcloak = require("envcloak").instance;

const constx = require(lab.getDevebotModule("utils/constx"));
const FRAMEWORK_PACKAGE_NAME = constx.FRAMEWORK.PACKAGE_NAME;

describe("tdd:lib:core:issue-inspector", function() {
  this.timeout(lab.getDefaultTimeout());

  let issueInspector = lab.getIssueInspector();

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

  describe("barrier()", function() {
    let loggingStore = {};

    before(function() {
      LogTracer.setupDefaultInterceptors([{
        accumulator: loggingStore,
        mappings: [{
          allTags: [ chores.toFullname(FRAMEWORK_PACKAGE_NAME, "issueInspector"), "examine" ],
          storeTo: "errorSummary"
        }]
      }]);
    });

    beforeEach(function() {
      LogTracer.reset().empty(loggingStore);
    });

    it("pass if no error has occurred", function() {
      let unhook = lab.preventExit();
      issueInspector.collect();
      issueInspector.collect({
        hasError: false,
        stage: "instantiating",
        type: "ROUTINE"
      });
      issueInspector.collect([{
        hasError: false,
        stage: "instantiating",
        type: "ROUTINE"
      }, {
        hasError: false,
        stage: "instantiating",
        type: "SERVICE"
      }, {
        hasError: false,
        stage: "instantiating",
        type: "TRIGGER"
      }]);
      issueInspector.barrier({exitOnError: true});
      let totalOfExit = unhook();
      assert.equal(totalOfExit, 0);
    });

    it("exit if there are some errors occurred", function() {
      let unhook = lab.preventExit({ throwException: true });

      function doSomething () {
        issueInspector.collect();

        issueInspector.collect({
          hasError: false,
          stage: "bootstrap",
          type: "plugin"
        });

        issueInspector.collect([{
          hasError: false,
          stage: "naming",
          type: "bridge"
        }, {
          hasError: false,
          stage: "naming",
          type: "plugin"
        }]);

        issueInspector.collect({
          hasError: true,
          stage: "config/schema",
          type: "bridge",
          name: "bridge#example",
          stack: "Error: {}"
        });

        issueInspector.barrier({exitOnError: true});
      }

      assert.throws(doSomething, lab.ProcessExitError);

      let totalOfExit = unhook();
      assert.equal(totalOfExit, 1);
    });

    afterEach(function() {
      issueInspector.reset();
    });

    after(function() {
      LogTracer.clearInterceptors();
    });
  });

  after(function() {
    envcloak.reset();
  });
});
