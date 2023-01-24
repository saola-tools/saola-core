"use strict";

var lab = require("../index");
var Devebot = lab.getDevebot();
var Promise = Devebot.require("bluebird");
var lodash = Devebot.require("lodash");
var debugx = Devebot.require("pinbug")("bdd:devebot:runhook:progress:meter");
var assert = require("chai").assert;
var DevebotApi = require("devebot-api");

describe("bdd:devebot:runhook:progress:meter", function() {
  this.timeout(lab.getDefaultTimeout());

  var app, api;

  before(function() {
    app = lab.getApp();
  });

  beforeEach(function(done) {
    api = new DevebotApi(lab.getApiConfig());
    app.server.start().asCallback(done);
  });

  it("direct runhook should return correct result", function() {
    var number = 15;
    var expectedValue = fibonacci(number);
    var expectedPrgr = [];
    lodash.range(number).map(function(n) {
      expectedPrgr.push(lodash.round((n + 1) * 100 / number));
    });
    var returnedPrgr = [];
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
    var number = 20;
    var expectedValue = fibonacci(number);
    var expectedPrgr = [];
    lodash.range(number).map(function(n) {
      expectedPrgr.push(lodash.round((n + 1) * 100 / number));
    });
    var returnedPrgr = [];
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
    var number = 101;
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
    var number = 101;
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

var fibonacci = function fibonacci (n) {
  if (n == 0 || n == 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
};
