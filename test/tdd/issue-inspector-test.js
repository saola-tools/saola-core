'use strict';

var lab = require('../index');
var Devebot = lab.getDevebot();
var chores = Devebot.require('chores');
var lodash = Devebot.require('lodash');
var debugx = Devebot.require('pinbug')('tdd:devebot:core:issue-inspector');
var assert = require('chai').assert;
var LogConfig = require('logolite').LogConfig;
var LogTracer = require('logolite').LogTracer;
var envmask = require('envmask').instance;

describe('tdd:devebot:core:issue-inspector', function() {
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
  });

  describe('barrier()', function() {
    var loggingStore = {};

    before(function() {
      LogTracer.setupDefaultInterceptors([{
        accumulator: loggingStore,
        mappings: [{
          allTags: [ chores.toFullname('devebot', 'issueInspector'), 'examine' ],
          storeTo: 'errorSummary'
        }]
      }]);
    });

    beforeEach(function() {
      LogTracer.reset().empty(loggingStore);
    });

    it('pass if no error has occurred', function() {
      var unhook = lab.preventExit();
      issueInspector.collect();
      issueInspector.collect({
        hasError: false,
        stage: 'instantiating',
        type: 'ROUTINE'
      });
      issueInspector.collect([{
        hasError: false,
        stage: 'instantiating',
        type: 'ROUTINE'
      }, {
        hasError: false,
        stage: 'instantiating',
        type: 'SERVICE'
      }, {
        hasError: false,
        stage: 'instantiating',
        type: 'TRIGGER'
      }]);
      issueInspector.barrier({exitOnError: true});
      var totalOfExit = unhook();
      assert.equal(totalOfExit, 0);
    });

    it('exit if there are some errors occurred', function() {
      var unhook = lab.preventExit({ throwException: true });

      function doSomething() {
        issueInspector.collect();

        issueInspector.collect({
          hasError: false,
          stage: 'bootstrap',
          type: 'plugin'
        });

        issueInspector.collect([{
          hasError: false,
          stage: 'naming',
          type: 'bridge'
        }, {
          hasError: false,
          stage: 'naming',
          type: 'plugin'
        }]);

        issueInspector.collect({
          hasError: true,
          stage: 'config/schema',
          type: 'bridge',
          name: 'bridge#example',
          stack: 'Error: {}'
        });

        issueInspector.barrier({exitOnError: true});
      }

      assert.throws(doSomething, lab.ProcessExitError);

      var totalOfExit = unhook();
      assert.equal(totalOfExit, 1);
    });

    afterEach(function() {
      issueInspector.reset();
    })

    after(function() {
      LogTracer.clearStringifyInterceptors();
    });
  });

  after(function() {
    envmask.reset();
  });
});