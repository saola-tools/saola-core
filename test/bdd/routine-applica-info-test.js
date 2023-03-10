"use strict";

const lab = require("../index");
const FRWK = lab.getFramework();
const Promise = FRWK.require("bluebird");
const lodash = FRWK.require("lodash");
const ApiClient = lab.getFrameworkApi();

const { assert } = require("liberica");

const constx = require(lab.getFrameworkModule("utils/constx"));
const FRAMEWORK_PACKAGE_NAME = constx.FRAMEWORK.PACKAGE_NAME;
const TEST_PACKAGE_AUTHOR = "devteam";

describe("bdd:api:routine:applica-info", function() {
  this.timeout(lab.getDefaultTimeout());

  describe("app.runner", function() {
    let app, api;

    before(function() {
      app = lab.getApp("default");
    });

    beforeEach(function() {
      api = new ApiClient(lab.getApiConfig({
        ws: app.runner.listen()
      }));
    });

    it("definition should contain [applica-info] command", function() {
      return new Promise(function(resolve, reject) {
        api.loadDefinition(function(err, obj) {
          if (err) return reject(err);
          resolve(obj.payload);
        });
      }).then(function(defs) {
        let cmd = lodash.keyBy(defs.commands, "name")["applica-info"];
        false && console.info(cmd);
        assert.isNotNull(cmd);
        assert.deepEqual(cmd, {
          package: FRAMEWORK_PACKAGE_NAME,
          name: "applica-info",
          alias: "app-info",
          description: "Display application information",
          options: []
        });
      });
    });

    it("invoked [applica-info] command return correct result", function() {
      return new Promise(function(resolve, reject) {
        api
          .on("failed", function(result) {
            reject(result);
          })
          .on("completed", function(result) {
            resolve(result);
          })
          .execCommand({
            name: "applica-info",
            options: {}
          });
      }).then(function(result) {
        false && console.info(JSON.stringify(result, null, 2));
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
              "description": "Demo Application",
              "main": "index.js",
              "author": TEST_PACKAGE_AUTHOR,
              "license": "ISC",
              "layerware": [
                {
                  "version": "0.1.1",
                  "name": "plugin1",
                  "description": "",
                  "main": "index.js",
                  "author": TEST_PACKAGE_AUTHOR,
                  "license": "ISC"
                },
                {
                  "version": "0.1.2",
                  "name": "plugin2",
                  "description": "",
                  "main": "index.js",
                  "author": TEST_PACKAGE_AUTHOR,
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
      app = lab.getApp("default");
      api = new ApiClient(lab.getApiConfig());
    });

    beforeEach(function() {
      return app.server.start();
    });

    afterEach(function() {
      return app.server.stop();
    });

    it("definition should contain [applica-info] command", function() {
      return new Promise(function(resolve, reject) {
        api.loadDefinition(function(err, obj) {
          if (err) return reject(err);
          resolve(obj.payload);
        });
      }).then(function(defs) {
        let cmd = lodash.keyBy(defs.commands, "name")["applica-info"];
        false && console.info(cmd);
        assert.isNotNull(cmd);
        assert.deepEqual(cmd, {
          package: FRAMEWORK_PACKAGE_NAME,
          name: "applica-info",
          alias: "app-info",
          description: "Display application information",
          options: []
        });
      });
    });

    it("invoked [applica-info] command return correct result", function() {
      return new Promise(function(resolve, reject) {
        api
          .on("failed", function(result) {
            reject(result);
          })
          .on("completed", function(result) {
            resolve(result);
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
              "description": "Demo Application",
              "main": "index.js",
              "author": TEST_PACKAGE_AUTHOR,
              "license": "ISC",
              "layerware": [
                {
                  "version": "0.1.1",
                  "name": "plugin1",
                  "description": "",
                  "main": "index.js",
                  "author": TEST_PACKAGE_AUTHOR,
                  "license": "ISC"
                },
                {
                  "version": "0.1.2",
                  "name": "plugin2",
                  "description": "",
                  "main": "index.js",
                  "author": TEST_PACKAGE_AUTHOR,
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
});
