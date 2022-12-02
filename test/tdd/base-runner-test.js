'use strict';

var lab = require('../index');
var Devebot = lab.getDevebot();
var Promise = Devebot.require('bluebird');
var chores = Devebot.require('chores');
var lodash = Devebot.require('lodash');
var loader = Devebot.require('loader');
var debugx = Devebot.require('pinbug')('tdd:devebot:base:runner');
var assert = require('chai').assert;
var path = require('path');
var util = require('util');
var LogConfig = Devebot.require('logolite').LogConfig;
var LogTracer = Devebot.require('logolite').LogTracer;
var envcloak = require('envcloak').instance;
var Runner = lab.acquireDevebotModule('runner');
var WsServerMock = Runner.__get__("WsServerMock");
var WsClientMock = Runner.__get__("WsClientMock");

describe.skip('tdd:devebot:base:runner', function() {
  this.timeout(lab.getDefaultTimeout());

  var issueInspector = lab.getIssueInspector();

  before(function() {
    envcloak.setup({
      NODE_ENV: 'test',
      LOGOLITE_FULL_LOG_MODE: 'false',
      LOGOLITE_ALWAYS_ENABLED: 'all',
      LOGOLITE_ALWAYS_MUTED: 'all',
      DEVEBOT_FORCING_SILENT: 'issue-inspector'
    });
    LogConfig.reset();
    issueInspector.reset();
    chores.clearCache();
  });

  describe('MockWsServer', function() {
    var {loggingFactory, schemaValidator} = lab.createBasicServices('fullapp');
    var L = loggingFactory.getLogger();
    var T = loggingFactory.getTracer();

    after(function() {
      LogTracer.clearInterceptors();
      issueInspector.reset();
    });
  });

  after(function() {
    envcloak.reset();
  });
});
