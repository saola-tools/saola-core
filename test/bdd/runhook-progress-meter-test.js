"use strict";

const lab = require("../index");
const Devebot = lab.getDevebot();
const Promise = Devebot.require("bluebird");
const chores = Devebot.require("chores");
const lodash = Devebot.require("lodash");
const debugx = Devebot.require("pinbug")("bdd:api:runhook:progress:meter");
const assert = require("chai").assert;
const DevebotApi = require("devebot-api");

describe("bdd:api:runhook:progress:meter", function() {
  this.timeout(lab.getDefaultTimeout());

  let app, api;

  before(function() {
    chores.setEnvironments({
      NODE_ENV: "test",
      LOGOLITE_FULL_LOG_MODE: "false",
      LOGOLITE_ALWAYS_ENABLED: "all",
      LOGOLITE_ALWAYS_MUTED: "all"
    });
    app = lab.getApp("default");
  });

  after(function() {
    chores.clearCache();
  });

  beforeEach(function(done) {
    api = new DevebotApi(lab.getApiConfig());
    app.server.start().asCallback(done);
  });

  it("direct runhook should return correct result", function() {
    let number = 15;
    let expectedValue = fibonacci(number);
    let expectedPrgr = [];
    lodash.range(number).map(function(n) {
      expectedPrgr.push(lodash.round((n + 1) * 100 / number));
    });
    let returnedPrgr = [];
    return new Promise(function(resolve, reject) {
      debugx.enabled && debugx("Invoke the command");
      api.on("failed", function(result) {
        reject(result);
      });
      api.on("completed", function(result) {
        resolve(result);
      });
      api.on("progress", function(status) {
        returnedPrgr.push(status.progress);
      });
      api.execCommand({
        name: "plugin2-routine1",
        data: { "number": number },
        mode: "direct"
      });
    }).then(function(result) {
      debugx.enabled && debugx("Expected progress: %s", JSON.stringify(expectedPrgr));
      debugx.enabled && debugx("Returned progress: %s", JSON.stringify(returnedPrgr));
      assert.sameOrderedMembers(expectedPrgr, returnedPrgr);
      debugx.enabled && debugx(JSON.stringify(result, null, 2));
      assert.equal(result.payload[0].data.fibonacci, expectedValue);
    }).catch(function(error) {
      debugx.enabled && debugx(JSON.stringify(error, null, 2));
      throw error;
    });
  });

  it("remote runhook should return correct result", function() {
    let number = 20;
    let expectedValue = fibonacci(number);
    let expectedPrgr = [];
    lodash.range(number).map(function(n) {
      expectedPrgr.push(lodash.round((n + 1) * 100 / number));
    });
    let returnedPrgr = [];
    return new Promise(function(resolve, reject) {
      api.on("failed", function(result) {
        reject(result);
      });
      api.on("completed", function(result) {
        resolve(result);
      });
      api.on("progress", function(status) {
        returnedPrgr.push(status.progress);
      });
      api.execCommand({
        name: "plugin2-routine1",
        data: { "number": number },
        mode: "remote"
      });
    }).then(function(result) {
      debugx.enabled && debugx("Expected progress: %s", JSON.stringify(expectedPrgr));
      debugx.enabled && debugx("Returned progress: %s", JSON.stringify(returnedPrgr));
      assert.sameOrderedMembers(expectedPrgr, returnedPrgr);
      debugx.enabled && debugx(JSON.stringify(result, null, 2));
      assert.equal(result.payload[0].data.fibonacci, expectedValue);
    }).catch(function(error) {
      debugx.enabled && debugx(JSON.stringify(error, null, 2));
      throw error;
    });
  });

  it("return error when input data is invalid with schema", function() {
    let number = 101;
    return new Promise(function(resolve, reject) {
      api.on("failed", function(result) {
        reject(result);
      });
      api.on("completed", function(result) {
        resolve(result);
      });
      api.execCommand({
        name: "plugin2-routine1",
        data: { "number": number },
        mode: "remote"
      });
    }).then(function(result) {
      debugx.enabled && debugx(JSON.stringify(result, null, 2));
      assert.fail("This testcase must raise an error");
    }, function(error) {
      debugx.enabled && debugx(JSON.stringify(error, null, 2));
      assert.isObject(error.payload[0].data.schema);
      assert.isString(error.payload[0].data.message);
    });
  });

  it("return error when input data cannot pass validate()", function() {
    let number = 101;
    return new Promise(function(resolve, reject) {
      api.on("failed", function(result) {
        reject(result);
      });
      api.on("completed", function(result) {
        resolve(result);
      });
      api.execCommand({
        name: "plugin2-routine3",
        data: { "number": number },
        mode: "remote"
      });
    }).then(function(result) {
      debugx.enabled && debugx(JSON.stringify(result, null, 2));
      assert.fail("This testcase must raise an error");
    }, function(error) {
      debugx.enabled && debugx(JSON.stringify(error, null, 2));
      assert.isString(error.payload[0].data.message);
    });
  });

  afterEach(function(done) {
    api = null;
    app.server.stop().asCallback(done);
  });
});

function fibonacci (n) {
  if (n == 0 || n == 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
};
