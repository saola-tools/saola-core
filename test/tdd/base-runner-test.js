"use strict";

const lab = require("../index");
const FRWK = lab.getFramework();
const Promise = FRWK.require("bluebird");
const chores = FRWK.require("chores");
const lodash = FRWK.require("lodash");
const loader = FRWK.require("loader");
const path = require("path");
const util = require("util");
const LogConfig = FRWK.require("logolite").LogConfig;
const LogTracer = FRWK.require("logolite").LogTracer;
const envcloak = require("envcloak").instance;
const Runner = lab.acquireFrameworkModule("runner");
const WsServerMock = Runner.__get__("WsServerMock");
const WsClientMock = Runner.__get__("WsClientMock");

const { assert } = require("liberica");

const constx = require(lab.getFrameworkModule("utils/constx"));
const FRAMEWORK_NAMESPACE = constx.FRAMEWORK.NAMESPACE;
const FRAMEWORK_NAMESPACE_UCASE = lodash.toUpper(FRAMEWORK_NAMESPACE);

describe.skip("tdd:lib:base:runner", function() {
  this.timeout(lab.getDefaultTimeout());

  let issueInspector = lab.getIssueInspector();

  before(function() {
    envcloak.setup({
      LOGOLITE_FULL_LOG_MODE: "false",
      LOGOLITE_ALWAYS_ENABLED: "all",
      LOGOLITE_ALWAYS_MUTED: "all",
      [FRAMEWORK_NAMESPACE_UCASE + "_FORCING_SILENT"]: "issue-inspector",
      [FRAMEWORK_NAMESPACE_UCASE + "_NODE_ENV"]: "test",
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
