"use strict";

const lab = require("../index");
const Devebot = lab.getFramework();
const Promise = Devebot.require("bluebird");
const chores = Devebot.require("chores");
const lodash = Devebot.require("lodash");
const loader = Devebot.require("loader");
const debugx = Devebot.require("pinbug")("tdd:devebot:base:runner");
const assert = require("chai").assert;
const path = require("path");
const util = require("util");
const LogConfig = Devebot.require("logolite").LogConfig;
const LogTracer = Devebot.require("logolite").LogTracer;
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

  describe("MockWsServer", function() {
    let {loggingFactory, schemaValidator} = lab.createBasicServices("fullapp");
    let L = loggingFactory.getLogger();
    let T = loggingFactory.getTracer();

    after(function() {
      LogTracer.clearInterceptors();
      issueInspector.reset();
    });
  });

  after(function() {
    envcloak.reset();
  });
});
