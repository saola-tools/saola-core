"use strict";

const lab = require("../index");
const Devebot = lab.getDevebot();
const Promise = Devebot.require("bluebird");
const lodash = Devebot.require("lodash");
const assert = require("chai").assert;
const DevebotApi = require("devebot-api");

const constx = require(lab.getDevebotModule("utils/constx"));

describe("bdd:api:routine:applica-info", function() {
  this.timeout(lab.getDefaultTimeout());

  describe("app.runner", function() {
    let app, api;

    before(function() {
      app = lab.getApp();
    });

    beforeEach(function() {
      api = new DevebotApi(lab.getApiConfig({
        ws: app.runner.listen()
      }));
    });

    it("definition should contain [applica-info] command", function() {
      return new Promise(function(resolved, rejected) {
        api.loadDefinition(function(err, obj) {
          if (err) return rejected(err);
          resolved(obj.payload);
        });
      }).then(function(defs) {
        let cmd = lodash.keyBy(defs.commands, "name")["applica-info"];
        false && console.log(cmd);
        assert.isNotNull(cmd);
        assert.deepEqual(cmd, {
          package: constx.FRAMEWORK.NAME,
          name: "applica-info",
          alias: "app-info",
          description: "Display application information",
          options: []
        });
      });
    });

    it("invoked [applica-info] command return correct result", function() {
      return new Promise(function(resolved, rejected) {
        api
          .on("failed", function(result) {
            rejected(result);
          })
          .on("completed", function(result) {
            resolved(result);
          })
          .execCommand({
            name: "applica-info",
            options: {}
          });
      }).then(function(result) {
        false && console.log(JSON.stringify(result, null, 2));
        assert.equal(result.state, "completed");
        assert.deepEqual(result.command, {
          "name": "applica-info",
          "options": {}
        });
        assert.deepEqual(result.payload, [
          {
            "type": "json",
            "title": "Application Information",
            "data": {
              "version": "0.1.0",
              "name": "demo-app",
              "description": "Devebot Demo Application",
              "main": "index.js",
              "author": "devebot",
              "license": "ISC",
              "layerware": [
                {
                  "version": "0.1.1",
                  "name": "plugin1",
                  "description": "",
                  "main": "index.js",
                  "author": "devebot",
                  "license": "ISC"
                },
                {
                  "version": "0.1.2",
                  "name": "plugin2",
                  "description": "",
                  "main": "index.js",
                  "author": "devebot",
                  "license": "ISC"
                }
              ],
              "framework": lab.getFrameworkInfo()
            }
          }
        ]);
      });
    });
  });

  describe("app.server", function() {
    let app, api;

    before(function() {
      app = lab.getApp();
      api = new DevebotApi(lab.getApiConfig());
    });

    beforeEach(function(done) {
      app.server.start().asCallback(done);
    });

    it("definition should contain [applica-info] command", function() {
      return new Promise(function(resolved, rejected) {
        api.loadDefinition(function(err, obj) {
          if (err) return rejected(err);
          resolved(obj.payload);
        });
      }).then(function(defs) {
        let cmd = lodash.keyBy(defs.commands, "name")["applica-info"];
        false && console.log(cmd);
        assert.isNotNull(cmd);
        assert.deepEqual(cmd, {
          package: constx.FRAMEWORK.NAME,
          name: "applica-info",
          alias: "app-info",
          description: "Display application information",
          options: []
        });
      });
    });

    it("invoked [applica-info] command return correct result", function() {
      return new Promise(function(resolved, rejected) {
        api
          .on("failed", function(result) {
            rejected(result);
          })
          .on("completed", function(result) {
            resolved(result);
          })
          .execCommand({
            name: "applica-info",
            options: {}
          });
      }).then(function(result) {
        assert.equal(result.state, "completed");
        assert.deepEqual(result.command, {
          "name": "applica-info",
          "options": {}
        });
        assert.deepEqual(result.payload, [
          {
            "type": "json",
            "title": "Application Information",
            "data": {
              "version": "0.1.0",
              "name": "demo-app",
              "description": "Devebot Demo Application",
              "main": "index.js",
              "author": "devebot",
              "license": "ISC",
              "layerware": [
                {
                  "version": "0.1.1",
                  "name": "plugin1",
                  "description": "",
                  "main": "index.js",
                  "author": "devebot",
                  "license": "ISC"
                },
                {
                  "version": "0.1.2",
                  "name": "plugin2",
                  "description": "",
                  "main": "index.js",
                  "author": "devebot",
                  "license": "ISC"
                }
              ],
              "framework": lab.getFrameworkInfo()
            }
          }
        ]);
      });
    });

    afterEach(function(done) {
      app.server.stop().asCallback(done);
    });
  });
});
