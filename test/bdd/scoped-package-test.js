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

describe("bdd:app:scoped-package-examples", function() {
  before(function() {
    chores.setEnvironments({
      [FRAMEWORK_NAMESPACE_UCASE + "_FORCING_SILENT"]: [
        "framework",
        lab.getPrefixScopedName() + "demo-app",
        lab.getPrefixScopedName() + "plugin-case0"
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
    const example = require("../app/scoped-pkg-example");
    const expected = [
      {
        "status": 200,
        "data": {
          [lab.getPrefixScopedName() + "plugin-case0/handler"]: {
            "blockRef": lab.getPrefixScopedName() + "plugin-case0/handler",
            "bridges": {
              "bridgeCase0Instance0": {
                "config": {
                  "apiToken": "plugin-case0/bridge-case0",
                  "apiSecret": "lf3aezk10xgldbho1xb"
                }
              }
            }
          },
          [lab.getPrefixScopedName() + "plugin-case0/servlet"]: {
            "blockRef": lab.getPrefixScopedName() + "plugin-case0/servlet",
            "bridges": {
              "bridgeCase0Instance0": {
                "config": {
                  "apiToken": "plugin-case0/bridge-case0",
                  "apiSecret": "lf3aezk10xgldbho1xb"
                }
              }
            }
          }
        }
      },
      {
        "status": 200,
        "data": {
          "packageName": lab.getPrefixScopedName() + "demo-app",
          "config": {
            [lab.getPrefixScopedName() + "demo-app/servlet"]: {
              "host": "0.0.0.0",
              "port": 17770,
              "verbose": true
            },
            [lab.getPrefixScopedName() + "demo-app/handler"]: {
              "host": "0.0.0.0",
              "port": 17770,
              "verbose": true
            }
          }
        }
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
          url: " http://127.0.0.1:17770",
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
