"use strict";

const axios = require("axios");
const { assert } = require("liberica");

const lab = require("../index");
const FRWK = lab.getFramework();

const Promise = FRWK.require("bluebird");
const chores = FRWK.require("chores");
const lodash = FRWK.require("lodash");

describe("bdd:app:scoped-package-examples", function() {
  before(function() {
    chores.setEnvironments({
      DEVEBOT_FORCING_SILENT: "framework,@devebot/demo-app,@devebot/plugin-case0",
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
    const example = require("../app/scoped-pkg-example");
    const expected = [
      {
        "status": 200,
        "data": {
          "@devebot/plugin-case0/handler": {
            "blockRef": "@devebot/plugin-case0/handler",
            "bridges": {
              "bridgeCase0Instance0": {
                "config": {
                  "apiToken": "plugin-case0/bridge-case0",
                  "apiSecret": "lf3aezk10xgldbho1xb"
                }
              }
            }
          },
          "@devebot/plugin-case0/servlet": {
            "blockRef": "@devebot/plugin-case0/servlet",
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
          "packageName": "@devebot/demo-app",
          "config": {
            "@devebot/demo-app/servlet": {
              "host": "0.0.0.0",
              "port": 17770,
              "verbose": true
            },
            "@devebot/demo-app/handler": {
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
