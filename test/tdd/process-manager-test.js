"use strict";

const lab = require("../index");
const FRWK = lab.getFramework();
const lodash = FRWK.require("lodash");
const path = require("path");
const util = require("util");
const LogConfig = FRWK.require("logolite").LogConfig;
const LogTracer = FRWK.require("logolite").LogTracer;
const Envcloak = require("envcloak");
const envcloak = Envcloak.instance;

const { assert } = require("liberica");

const constx = require(lab.getFrameworkModule("utils/constx"));
const FRAMEWORK_NAMESPACE = constx.FRAMEWORK.NAMESPACE;
const FRAMEWORK_NAMESPACE_UCASE = lodash.toUpper(FRAMEWORK_NAMESPACE);

describe("tdd:lib:core:process-manager", function() {
  this.timeout(lab.getDefaultTimeout());

  let issueInspector = lab.getIssueInspector();

  before(function() {
    envcloak.setup({
      LOGOLITE_FULL_LOG_MODE: "false",
      LOGOLITE_ALWAYS_ENABLED: "all",
      LOGOLITE_ALWAYS_MUTED: "all",
      [FRAMEWORK_NAMESPACE_UCASE + "_NODE_ENV"]: "test",
    });
    issueInspector.reset();
    LogConfig.reset();
  });

  after(function() {
    envcloak.reset();
    issueInspector.reset();
  });

  it("process with 'pm_id'~6, 'instances'~3 will run in cluster mode, as a master", function() {
    let localEnv = new Envcloak({
      presets: {
        pm_id: "6",
        instances: "3"
      }
    });
    let processManager = lab.createProcessManager(null);
    assert.equal(processManager.available, true);
    assert.equal(processManager.id, 6);
    assert.equal(processManager.total, 3);
    assert.equal(processManager.isMaster, true);
    localEnv.reset();
  });

  it("process with 'pm_id'~3, 'instances'~2 will run in cluster mode, as a worker", function() {
    let localEnv = new Envcloak({
      presets: {
        pm_id: "3",
        instances: "2"
      }
    });
    let processManager = lab.createProcessManager(null);
    assert.equal(processManager.available, true);
    assert.equal(processManager.id, 3);
    assert.equal(processManager.total, 2);
    assert.equal(processManager.isMaster, false);
    localEnv.reset();
  });

  it("process with 'pm_id'~3, undefined 'instances' will run in single mode", function() {
    let localEnv = new Envcloak({
      presets: {
        pm_id: "3"
      }
    });
    let processManager = lab.createProcessManager(null);
    assert.equal(processManager.available, false);
    assert.equal(processManager.id, 3);
    assert.isUndefined(processManager.total);
    assert.equal(processManager.isMaster, false);
    localEnv.reset();
  });

  it("process with undefined 'pm_id', 'instances'~1 will run in single mode", function() {
    let localEnv = new Envcloak({
      presets: {
        instances: "1"
      }
    });
    let processManager = lab.createProcessManager(null);
    assert.equal(processManager.available, false);
    assert.isUndefined(processManager.id);
    assert.equal(processManager.total, 1);
    assert.equal(processManager.isMaster, false);
    localEnv.reset();
  });
});
