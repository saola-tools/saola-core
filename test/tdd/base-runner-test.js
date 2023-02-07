"use strict";

const lab = require("../index");
const FRWK = lab.getFramework();
const Promise = FRWK.require("bluebird");
const chores = FRWK.require("chores");
const lodash = FRWK.require("lodash");
const loader = FRWK.require("loader");
const debugx = FRWK.require("pinbug")("tdd:devebot:base:runner");
const assert = require("chai").assert;
const path = require("path");
const util = require("util");
const LogConfig = FRWK.require("logolite").LogConfig;
const LogTracer = FRWK.require("logolite").LogTracer;
const envcloak = require("envcloak").instance;
const Runner = lab.acquireFrameworkModule("runner");
const WsServerMock = Runner.__get__("WsServerMock");
const WsClientMock = Runner.__get__("WsClientMock");

describe.skip("tdd:lib:base:runner", function() {
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
    chores.clearCache();
  });

  after(function() {
    envcloak.reset();
  });

  describe("MockWsServer", function() {
    let {loggingFactory, schemaValidator} = lab.createBasicServices("fullapp");
    let L = loggingFactory.getLogger();
    let T = loggingFactory.getTracer();

    after(function() {
      LogTracer.clearInterceptors();
      issueInspector.reset();
    });
  });
});
