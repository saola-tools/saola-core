"use strict";

const lab = require("../index");
const FRWK = lab.getFramework();
const Promise = FRWK.require("bluebird");
const chores = FRWK.require("chores");
const lodash = FRWK.require("lodash");
const debugx = FRWK.require("pinbug")("devteam:bdd:api:command:execution");
const LogConfig = FRWK.require("logolite").LogConfig;
const LogTracer = FRWK.require("logolite").LogTracer;
const envcloak = require("envcloak").instance;
const ApiClient = lab.getFrameworkApi();

const { assert } = require("liberica");

const constx = require(lab.getFrameworkModule("utils/constx"));
const FRAMEWORK_NAMESPACE = constx.FRAMEWORK.NAMESPACE;
const FRAMEWORK_METADATA = FRAMEWORK_NAMESPACE + "-metadata";

describe("bdd:api:command:execution", function() {
  this.timeout(lab.getDefaultTimeout());

  let app, api;
  let logStats = {};
  let logCounter = LogTracer.accumulationAppender.bind(null, logStats, [
    {
      matchingField: "checkpoint",
      matchingRule: /plugin1-routine1-.*/g,
      countTo: "plugin1Routine1Count"
    },
    {
      matchingField: "checkpoint",
      matchingRule: /plugin1-routine2-.*/g,
      countTo: "plugin1Routine2Count"
    }
  ]);
  let logScraper = LogTracer.accumulationAppender.bind(null, logStats, [
    {
      anyTags: [ "logolite-metadata", FRAMEWORK_METADATA ],
      storeTo: "blockLoggingState"
    },
    {
      matchingField: "checkpoint",
      matchingRule: "plugin1-routine1-injected-names",
      selectedFields: ["injectedServiceNames", "blockId", "instanceId"],
      storeTo: "plugin1Routine1State"
    },
    {
      matchingField: "checkpoint",
      matchingRule: "plugin1-routine2-injected-names",
      selectedFields: ["injectedServiceNames", "blockId", "instanceId"],
      storeTo: "plugin1Routine2State"
    }
  ]);
  let injectedServiceNames = [];

  before(function() {
    envcloak.setup({
      LOGOLITE_FULL_LOG_MODE: "false",
      LOGOLITE_ALWAYS_ENABLED: "all"
    });
    LogConfig.reset();
    LogTracer.reset();
    LogTracer.clearInterceptors();
    LogTracer.addInterceptor(logCounter);
    LogTracer.addInterceptor(logScraper);
    app = lab.getApp("default");
    injectedServiceNames = [
      chores.toFullname("application", "mainService"),
      chores.toFullname("plugin1", "plugin1Service"),
      chores.toFullname("plugin2", "plugin2Service")
    ];
    // run in bridge-full-ref mode, and apply presets config
    // don't care for standardizing-config feature
    if (chores.isUpgradeSupported(["bridge-full-ref", "presets"])) {
      injectedServiceNames.push.apply(injectedServiceNames, [
        chores.toFullname("plugin1", "bridge1#anyname1a"),
        chores.toFullname("plugin2", "bridge1#anyname1b"),
        chores.toFullname("plugin2", "bridge1#anyname1c"),
        chores.toFullname("plugin1", "bridge2#anyname2a"),
        chores.toFullname("plugin2", "bridge2#anyname2b"),
        chores.toFullname("plugin1", "bridge2#anyname2c")
      ]);
    }
    if (!chores.isUpgradeSupported("bridge-full-ref")) {
      injectedServiceNames.push.apply(injectedServiceNames, [
        chores.toFullname("bridge1", "anyname1a"),
        chores.toFullname("bridge1", "anyname1b"),
        chores.toFullname("bridge1", "anyname1c"),
        chores.toFullname("bridge2", "anyname2a"),
        chores.toFullname("bridge2", "anyname2b"),
        chores.toFullname("bridge2", "anyname2c")
      ]);
    }
    api = new ApiClient(lab.getApiConfig());
  });

  beforeEach(function() {
    LogTracer.reset().empty(logStats);
    return app.server.start();
  });

  afterEach(function() {
    return app.server.stop();
  });

  after(function() {
    LogTracer.clearInterceptors();
    envcloak.reset();
  });

  it("definition should contain runhook-call command", function() {
    return new Promise(function(resolve, reject) {
      api.loadDefinition(function(err, obj) {
        if (err) return reject(err);
        resolve(obj.payload);
      });
    }).then(function(defs) {
      let cmd = lodash.keyBy(defs.commands, "name")["plugin1-routine1"];
      assert.isNotNull(cmd);
    });
  });

  it("remote runhook should return correct result", function() {
    return new Promise(function(resolve, reject) {
      api.on("failed", function(result) {
        reject(result);
      });
      api.on("completed", function(result) {
        resolve(result);
      });
      api.execCommand({
        name: "plugin1-routine1",
        options: {},
        data: { "key": "hello", "value": "world" }
      });
    }).then(function(result) {
      debugx.enabled && debugx(JSON.stringify(result, null, 2));
      assert.equal(logStats["plugin1Routine1Count"], 3);
      assert.isArray(logStats["plugin1Routine1State"]);
      assert.equal(logStats["plugin1Routine1State"].length, 1);
      assert.sameMembers(logStats["plugin1Routine1State"][0]["injectedServiceNames"], injectedServiceNames);
    }).catch(function(error) {
      debugx.enabled && debugx(JSON.stringify(error, null, 2));
      throw error;
    });
  });

  it("direct runhook should return correct result", function() {
    return new Promise(function(resolve, reject) {
      api.on("failed", function(result) {
        reject(result);
      });
      api.on("completed", function(result) {
        resolve(result);
      });
      api.execCommand({
        name: "plugin1-routine2",
        data: { "key": "hello", "value": "world" }
      });
    }).then(function(result) {
      debugx.enabled && debugx(JSON.stringify(result, null, 2));
      assert.equal(logStats["plugin1Routine2Count"], 3);
      assert.isArray(logStats["plugin1Routine2State"]);
      assert.equal(logStats["plugin1Routine2State"].length, 1);
      assert.sameMembers(logStats["plugin1Routine2State"][0]["injectedServiceNames"], injectedServiceNames);
    }).catch(function(error) {
      debugx.enabled && debugx(JSON.stringify(error, null, 2));
      throw error;
    });
  });
});
