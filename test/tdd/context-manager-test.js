"use strict";

const lab = require("../index");
const FRWK = lab.getFramework();
const Promise = FRWK.require("bluebird");
const chores = FRWK.require("chores");
const lodash = FRWK.require("lodash");
const assert = require("chai").assert;
const LogConfig = FRWK.require("logolite").LogConfig;
const LogTracer = FRWK.require("logolite").LogTracer;
const Envcloak = require("envcloak");
const envcloak = Envcloak.instance;

describe("tdd:lib:core:context-manager", function() {
  this.timeout(lab.getDefaultTimeout());

  let sampleProjectName = "state-verification";
  let issueInspector = lab.getIssueInspector();

  before(function() {
    envcloak.setup({
      LOGOLITE_FULL_LOG_MODE: "false",
      LOGOLITE_ALWAYS_ENABLED: "all",
      LOGOLITE_ALWAYS_MUTED: "all",
      DEVEBOT_NODE_ENV: "test",
    });
    issueInspector.reset();
    LogConfig.reset();
  });

  beforeEach(function() {
    chores.clearCache();
  });

  after(function() {
    envcloak.reset();
    issueInspector.reset();
    chores.clearCache();
  });

  it("isFeatureSupported() return true with provided features", function() {
    let localEnv = new Envcloak({
      presets: {
        STATE_VERIFICATION_FEATURE_ENABLED: "123, abc"
      }
    });
    let contextManager = lab.getContextManager(sampleProjectName).clearCache();
    assert.isFalse(contextManager.isFeatureSupported("unknown"));
    assert.isTrue(contextManager.isFeatureSupported("abc"));
    assert.isTrue(contextManager.isFeatureSupported(["123", "abc"]));
    assert.isTrue(contextManager.isFeatureSupported(["def"]));
    assert.isTrue(contextManager.isFeatureSupported(["def", "abc"]));
    localEnv.reset();
  });

  it("FEATURE_DISABLED has a higher priority than FEATURE_ENABLED", function() {
    let localEnv = new Envcloak({
      presets: {
        STATE_VERIFICATION_FEATURE_DISABLED: "abc, def",
        STATE_VERIFICATION_FEATURE_ENABLED: "123, abc"
      }
    });
    let contextManager = lab.getContextManager(sampleProjectName).clearCache();
    assert.isFalse(contextManager.isFeatureSupported("abc"));
    assert.isFalse(contextManager.isFeatureSupported(["123", "def"]));
    localEnv.reset();
  });
});
