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
var LogConfig = require('logolite').LogConfig;
var LogTracer = require('logolite').LogTracer;
var envmask = require('envmask').instance;
var envbox = require(lab.getDevebotModule('utils/envbox'));
var rewire = require('rewire');
var Runner = rewire(lab.getDevebotModule('runner'));
var WsServerMock = Runner.__get__("WsServerMock");
var WsClientMock = Runner.__get__("WsClientMock");
var sinon = require('sinon');

describe.skip('tdd:devebot:base:runner', function() {
  this.timeout(lab.getDefaultTimeout());

  var issueInspector = lab.getIssueInspector();

  before(function() {
    envmask.setup({
      NODE_ENV: 'test',
      LOGOLITE_ALWAYS_ENABLED: 'all',
      LOGOLITE_ALWAYS_MUTED: 'all',
      DEVEBOT_FORCING_SILENT: 'issue-inspector'
    });
    LogConfig.reset();
    issueInspector.reset();
    envbox.clearCache();
  });

  describe('MockWsServer', function() {
    var {loggingFactory, schemaValidator} = lab.createBasicServices('fullapp');
    var L = loggingFactory.getLogger();
    var T = loggingFactory.getTracer();

    after(function() {
      LogTracer.clearStringifyInterceptors();
      issueInspector.reset();
    });
  });

  after(function() {
    envmask.reset();
  });
});
