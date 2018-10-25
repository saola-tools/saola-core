'use strict';

var lab = require('../index');
var Devebot = lab.getDevebot();
var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');
var loader = Devebot.require('loader');
var debugx = Devebot.require('pinbug')('tdd:devebot:core:process-manager');
var assert = require('chai').assert;
var path = require('path');
var util = require('util');
var LogConfig = require('logolite').LogConfig;
var LogTracer = require('logolite').LogTracer;
var EnvMask = require('envmask');
var envmask = EnvMask.instance;

describe('tdd:devebot:core:process-manager', function() {
  this.timeout(lab.getDefaultTimeout());

  var issueInspector = lab.getIssueInspector();

  before(function() {
    envmask.setup({
      NODE_ENV: 'test',
      LOGOLITE_ALWAYS_ENABLED: 'all',
      LOGOLITE_ALWAYS_MUTED: 'all'
    });
    issueInspector.reset();
    LogConfig.reset();
  });

  it("process with 'pm_id'~6, 'instances'~3 will run in cluster mode, as a master", function() {
    var localEnv = new EnvMask({
      pm_id: '6',
      instances: '3'
    });
    var processManager = lab.createProcessManager(null);
    assert.equal(processManager.available, true);
    assert.equal(processManager.id, 6);
    assert.equal(processManager.total, 3);
    assert.equal(processManager.isMaster, true);
    localEnv.reset();
  });

  it("process with 'pm_id'~3, 'instances'~2 will run in cluster mode, as a worker", function() {
    var localEnv = new EnvMask({
      pm_id: '3',
      instances: '2'
    });
    var processManager = lab.createProcessManager(null);
    assert.equal(processManager.available, true);
    assert.equal(processManager.id, 3);
    assert.equal(processManager.total, 2);
    assert.equal(processManager.isMaster, false);
    localEnv.reset();
  });

  it("process with 'pm_id'~3, undefined 'instances' will run in single mode", function() {
    var localEnv = new EnvMask({
      pm_id: '3'
    });
    var processManager = lab.createProcessManager(null);
    assert.equal(processManager.available, false);
    assert.equal(processManager.id, 3);
    assert.isUndefined(processManager.total);
    assert.equal(processManager.isMaster, false);
    localEnv.reset();
  });

  it("process with undefined 'pm_id', 'instances'~1 will run in single mode", function() {
    var localEnv = new EnvMask({
      instances: '1'
    });
    var processManager = lab.createProcessManager(null);
    assert.equal(processManager.available, false);
    assert.isUndefined(processManager.id);
    assert.equal(processManager.total, 1);
    assert.equal(processManager.isMaster, false);
    localEnv.reset();
  });

  after(function() {
    envmask.reset();
    issueInspector.reset();
  });
});
