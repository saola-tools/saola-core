"use strict";

const lab = require("../index");
const FRWK = lab.getFramework();
const Promise = FRWK.require("bluebird");
const lodash = FRWK.require("lodash");
const ApiClient = require("devebot-api");

const { assert } = require("liberica");

const constx = require(lab.getFrameworkModule("utils/constx"));
const FRAMEWORK_PACKAGE_NAME = constx.FRAMEWORK.PACKAGE_NAME;

describe("bdd:api:command:system-info", function() {
  this.timeout(lab.getDefaultTimeout());

  let app, api;

  before(function() {
    app = lab.getApp("default");
    api = new ApiClient(lab.getApiConfig());
  });

  beforeEach(function() {
    return app.server.start();
  });

  afterEach(function() {
    return app.server.stop();
  });

  it("definition should contain [system-info] command", function() {
    return new Promise(function(resolve, reject) {
      api.loadDefinition(function(err, obj) {
        if (err) return reject(err);
        resolve(obj.payload);
      });
    }).then(function(defs) {
      let cmd = lodash.keyBy(defs.commands, "name")["system-info"];
      false && console.info(cmd);
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
    return new Promise(function(resolve, reject) {
      api
        .on("failed", function(result) {
          reject(result);
        })
        .on("completed", function(result) {
          resolve(result);
        })
        .execCommand({
          name: "system-info",
          options: {}
        });
    }).then(function(result) {
      false && console.info(JSON.stringify(result, null, 2));
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
});
