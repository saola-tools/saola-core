"use strict";

const axios = require("axios");
const { assert } = require("liberica");

const lab = require("../index");
const FRWK = lab.getFramework();

const Promise = FRWK.require("bluebird");
const chores = FRWK.require("chores");
const lodash = FRWK.require("lodash");

const constx = require(lab.getFrameworkModule("utils/constx"));
const FRAMEWORK_NAMESPACE = constx.FRAMEWORK.NAMESPACE;
const FRAMEWORK_NAMESPACE_UCASE = lodash.toUpper(FRAMEWORK_NAMESPACE);

describe("bdd:app:name-backward-compatibility", function() {
  before(function() {
    chores.setEnvironments({
      [FRAMEWORK_NAMESPACE_UCASE + "_FORCING_SILENT"]: [
        "framework",
        "name-backward-compatibility",
        FRAMEWORK_NAMESPACE + "-dp-backward1",
        FRAMEWORK_NAMESPACE + "-dp-backward2",
        "plugin1",
        "plugin2",
        "plugin3"
      ].join(","),
      LOGOLITE_FULL_LOG_MODE: "false",
      LOGOLITE_ALWAYS_ENABLED: "all",
      LOGOLITE_ALWAYS_MUTED: "all"
    });
  });
  //
  after(function() {
    chores.clearCache();
  });
  //
  it("Request and response smoothly", function() {
    if (!chores.isUpgradeSupported("presets")) this.skip();
    if (!chores.isUpgradeSupported("bridge-full-ref")) this.skip();
    if (!chores.isUpgradeSupported("standardizing-config")) this.skip();
    //
    const example = require("../app/name-backward-compatibility");
    const expected = [
      {
        "status": 200,
        "data": {
          "packageName": "name-backward-compatibility",
          "config": {
            "name-backward-compatibility/mainTrigger": {
              "host": "0.0.0.0",
              "port": 17700,
              "verbose": true
            },
            "name-backward-compatibility/mainService": {
              "host": "0.0.0.0",
              "port": 17700,
              "verbose": true
            },
            [FRAMEWORK_NAMESPACE + "-dp-backward1/sublibService"]: {
              "host": "localhost",
              "port": 17721
            },
            [FRAMEWORK_NAMESPACE + "-dp-backward2/sublibService"]: {
              "host": "localhost",
              "port": 17722
            },
            "coBackward1": {
              "refPath": "sandbox -> backward1 -> application -> wrapper",
              "refType": "application",
              "refName": "name-backward-compatibility"
            },
            "coBackward2": {
              "refPath": "sandbox -> backward2 -> application -> wrapper",
              "refType": "application",
              "refName": "name-backward-compatibility"
            },
            "coConnector1": {
              "refPath": "sandbox -> connector1 -> application -> wrapper",
              "refType": "application",
              "refName": "name-backward-compatibility"
            },
            "coConnector2": {
              "refPath": "sandbox -> connector2 -> application -> wrapper",
              "refType": "application",
              "refName": "name-backward-compatibility"
            }
          }
        }
      },
      {
        "status": 200,
        "data": FRAMEWORK_NAMESPACE + "-dp-backward1 webserver"
      },
      {
        "status": 200,
        "data": FRAMEWORK_NAMESPACE + "-dp-backward2 webserver"
      }
    ];
    //
    return example.server.start().then(function() {
      return Promise.all([
        axios.request({
          url: "http://0.0.0.0:17700",
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          data: undefined,
          responseType: "json",
        }),
        axios.request({
          url: " http://127.0.0.1:17721",
          method: "GET",
          headers: {"Content-Type": "application/json"},
          data: undefined,
          responseType: "json",
        }),
        axios.request({
          url: " http://127.0.0.1:17722",
          method: "GET",
          headers: {"Content-Type": "application/json"},
          data: undefined,
          responseType: "json",
        }),
      ]);
    })
    .then(function(resps) {
      const output = lodash.map(resps, function(resp) {
        return {
          status: resp.status,
          data: resp.data
        };
      });
      false && console.log(JSON.stringify(output, null, 2));
      assert.sameDeepMembers(output, expected);
    })
    .catch(function(err) {
      console.log(err);
      assert.fail("This testcase must complete successfully");
    })
    .finally(function() {
      return example.server.stop();
    });
  });
});
