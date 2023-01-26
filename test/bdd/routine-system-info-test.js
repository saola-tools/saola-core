"use strict";

const lab = require("../index");
const Devebot = lab.getDevebot();
const Promise = Devebot.require("bluebird");
const lodash = Devebot.require("lodash");
const assert = require("chai").assert;
const DevebotApi = require("devebot-api");

const constx = require(lab.getDevebotModule("utils/constx"));
const FRAMEWORK_PACKAGE_NAME = constx.FRAMEWORK.NAME;

describe("bdd:api:command:system-info", function() {
  this.timeout(lab.getDefaultTimeout());

  let app, api;

  before(function() {
    app = lab.getApp("default");
    api = new DevebotApi(lab.getApiConfig());
  });

  beforeEach(function(done) {
    app.server.start().asCallback(done);
  });

  it("definition should contain [system-info] command", function() {
    return new Promise(function(resolved, rejected) {
      api.loadDefinition(function(err, obj) {
        if (err) return rejected(err);
        resolved(obj.payload);
      });
    }).then(function(defs) {
      let cmd = lodash.keyBy(defs.commands, "name")["system-info"];
      false && console.log(cmd);
      assert.isNotNull(cmd);
      assert.deepEqual(cmd, {
        package: FRAMEWORK_PACKAGE_NAME,
        name: "system-info",
        alias: "sys-info",
        description: "Display the system information (configuration, logger, sandbox)",
        options: []
      });
    });
  });

  it("invoked [system-info] command return correct result", function() {
    return new Promise(function(resolved, rejected) {
      api
        .on("failed", function(result) {
          rejected(result);
        })
        .on("completed", function(result) {
          resolved(result);
        })
        .execCommand({
          name: "system-info",
          options: {}
        });
    }).then(function(result) {
      false && console.log(JSON.stringify(result, null, 2));
      assert.equal(result.state, "completed");
      assert.deepEqual(result.command, {
        "name": "system-info",
        "options": {}
      });
      assert.lengthOf(result.payload, 1);
      let info = result.payload[0];
      assert.deepInclude(lodash.pick(info, ["type", "title", "label"]), {
        "type": "record",
        "title": "OS information",
        "label": {
          "os_platform": "Platform",
          "os_arch": "Architecture",
          "os_cpus": "CPUs",
          "os_hostname": "Hostname",
          "os_network_interface": "Network",
          "os_totalmem": "Total memory (MB)",
          "os_freemem": "Free memory (MB)",
          "os_loadavg": "Load averages",
          "os_uptime": "System uptime (h)"
        }
      });
      assert.containsAllKeys(info.data, [
        "os_platform", "os_arch", "os_hostname", "os_network_interface"
      ]);
      assert.isArray(info.data.os_cpus);
      assert.isNotEmpty(info.data.os_cpus);
      assert.isAbove(info.data.os_totalmem, 0);
      assert.isAtMost(info.data.os_freemem, info.data.os_totalmem);
      assert.isAbove(info.data.os_uptime, 0);
      assert.isArray(info.data.os_loadavg);
      assert.lengthOf(info.data.os_loadavg, 3);
    });
  });

  afterEach(function(done) {
    app.server.stop().asCallback(done);
  });
});
