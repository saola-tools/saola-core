'use strict';

var lab = require('../index');
var constx = require(lab.getDevebotModule('utils/constx'));
var Devebot = lab.getDevebot();
var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');
var assert = require('chai').assert;
var LogConfig = Devebot.require('logolite').LogConfig;
var LogTracer = Devebot.require('logolite').LogTracer;
var envcloak = require('envcloak').instance;
var sinon = require('sinon');

describe('tdd:devebot:core:script-renderer', function() {
  this.timeout(lab.getDefaultTimeout());

  var issueInspector = lab.getIssueInspector();
  var {loggingFactory, schemaValidator} = lab.createBasicServices();

  before(function() {
    envcloak.setup({
      NODE_ENV: 'test',
      LOGOLITE_FULL_LOG_MODE: 'false',
      LOGOLITE_ALWAYS_ENABLED: 'all',
      LOGOLITE_ALWAYS_MUTED: 'all'
    });
    LogConfig.reset();
    issueInspector.reset();
  });

  describe('WebSocketOutlet', function() {
    var ScriptRenderer = lab.acquireDevebotModule('backbone/script-renderer');
    var WebSocketOutlet = ScriptRenderer.__get__('WebSocketOutlet');
    var ws = { send: function() {} };
    var outlet = new WebSocketOutlet({
        ws: ws,
        logger: loggingFactory.getLogger(),
        tracer: loggingFactory.getTracer(),
        schemaValidator: schemaValidator
      });
    var testSend = function(state, supposed, expected) {
      var wsStub = null;
      var output = new Promise(function(onResolved, onRejected) {
        wsStub = sinon.stub(ws, 'send').callsFake(function(message) {
          false && console.log('Received message: %s', message);
          if (lodash.isEqual(JSON.parse(message), expected)) {
            onResolved(message);
          } else {
            onRejected(message);
          }
        });
        outlet.render(state, supposed);
      });
      output.finally(function() {
        wsStub && wsStub.restore();
      });
      return output;
    }
    var loggingStore = {};

    before(function() {
      assert.isNotNull(WebSocketOutlet);
      LogTracer.setupDefaultInterceptors([{
        accumulator: loggingStore,
        mappings: [{
          allTags: [ 'devebot/scriptRenderer', 'definition' ],
          storeTo: 'definition'
        }]
      }]);
    });

    beforeEach(function() {
      LogTracer.reset().empty(loggingStore);
    });

    it('WebSocketOutlet render states exactly', function(done) {
      Promise.mapSeries([
        {
          state: 'definition',
          supposed: {
            text: 'Any Object'
          },
          expected: {
            state: 'definition',
            payload: {
              text: 'Any Object'
            }
          }
        },
        {
          state: 'error',
          supposed: null,
          expected: {
            state: constx.WEBSOCKET.STATE.ERROR,
            message: constx.WEBSOCKET.MSG_ON.ERROR
          }
        },
        {
          state: 'started',
          supposed: null,
          expected: {
            state: constx.WEBSOCKET.STATE.STARTED,
            message: constx.WEBSOCKET.MSG_ON.STARTED
          }
        },
        {
          state: 'cancelled',
          supposed: null,
          expected: {
            state: constx.WEBSOCKET.STATE.CANCELLED,
            message: constx.WEBSOCKET.MSG_ON.CANCELLED
          }
        },
        {
          state: 'failed',
          supposed: {
            type: 'object',
            title: 'My Error',
            label: {
              error: 'Error',
              value: 'Value'
            },
            data: {
              error: true,
              value: 1024
            }
          },
          expected: {
            state: constx.WEBSOCKET.STATE.FAILED,
            message: constx.WEBSOCKET.MSG_ON.FAILED,
            payload: [{
              type: 'object',
              title: 'My Error',
              label: {
                error: 'Error',
                value: 'Value'
              },
              data: {
                error: true,
                value: 1024
              }
            }]
          }
        },
        {
          state: 'completed',
          supposed: {
            type: 'object',
            title: 'My Result',
            label: {
              f_int: 'Integer',
              f_boolean: 'Boolean',
              f_string: 'String'
            },
            data: {
              f_int: 1024,
              f_boolean: true,
              f_string: 'Hello'
            }
          },
          expected: {
            state: constx.WEBSOCKET.STATE.COMPLETED,
            message: constx.WEBSOCKET.MSG_ON.COMPLETED,
            payload: [{
              type: 'object',
              title: 'My Result',
              label: {
                f_int: 'Integer',
                f_boolean: 'Boolean',
                f_string: 'String'
              },
              data: {
                f_int: 1024,
                f_boolean: true,
                f_string: 'Hello'
              }
            }]
          }
        },
        {
          state: 'progress',
          supposed: {
            progress: 57,
            data: {
              msg: 'processing (57%)'
            }
          },
          expected: {
            state: constx.WEBSOCKET.STATE.PROGRESS,
            message: constx.WEBSOCKET.MSG_ON.PROGRESS,
            percent: 57,
            payload: {
              msg: 'processing (57%)'
            },
            progress: 57,
            data: {
              msg: 'processing (57%)'
            }
          }
        },
        {
          state: 'done',
          supposed: null,
          expected: {
            state: constx.WEBSOCKET.STATE.DONE
          }
        }
      ], function(item) {
        return testSend(item.state, item.supposed, item.expected);
      }).asCallback(done);
    });

    after(function() {
      LogTracer.clearInterceptors();
    });
  });

  describe('standardizeOutput()', function() {
    var ScriptRenderer = lab.acquireDevebotModule('backbone/script-renderer');
    var standardizeOutput = ScriptRenderer.__get__('standardizeOutput');

    var jsonOutput = {
      type: 'json',
      title: 'JSON format example',
      data: {
        text: 'Any JSON object'
      }
    };
    var objectOutput = {
      type: 'object',
      title: 'Object/Record format example',
      data: {
        error: true,
        value: 1024
      },
      label: {
        error: 'Error',
        value: 'Value'
      }
    };
    var tableOutput = {
      type: 'table',
      title: 'Table/Grid format example',
      data: [{
        no: 1,
        id: 'unique#1',
        name: 'Item 1'
      }, {
        no: 2,
        id: 'unique#2',
        name: 'Item 2'
      }, {
        no: 3,
        id: 'unique#3',
        name: 'Item 3'
      }],
      label: {
        no: 'No.',
        id: 'ID',
        name: 'Name'
      }
    };
    var invalidObjectFormat = {
      type: 'object',
      title: 'Object/Record format example',
      data: {
        error: true,
        value: 1024
      },
      label: 'Should be an object'
    };

    it('standardize valid json-type output correctly', function() {
      var expected = [jsonOutput];
      assert.deepEqual(standardizeOutput(schemaValidator,  jsonOutput , true), expected);
      assert.deepEqual(standardizeOutput(schemaValidator, [jsonOutput], true), expected);
    });

    it('standardize valid object-type output correctly', function() {
      var expected = [objectOutput];
      assert.deepEqual(standardizeOutput(schemaValidator,  objectOutput , true), expected);
      assert.deepEqual(standardizeOutput(schemaValidator, [objectOutput], true), expected);
    });

    it('standardize valid table-type output correctly', function() {
      var expected = [tableOutput];
      assert.deepEqual(standardizeOutput(schemaValidator,  tableOutput , true), expected);
      assert.deepEqual(standardizeOutput(schemaValidator, [tableOutput], true), expected);
    });

    it('standardize composed of output formats correctly', function() {
      var mixed = [jsonOutput, tableOutput, objectOutput];
      var expected = [jsonOutput, tableOutput, objectOutput];
      assert.deepEqual(standardizeOutput(schemaValidator,  mixed , true), expected);
    });

    it('standardizing invalid formats will return JSON output', function() {
      var expected = [{
        type: 'json',
        title: constx.WEBSOCKET.MSG_ON.FAILED,
        data: invalidObjectFormat
      }];
      assert.deepEqual(standardizeOutput(schemaValidator,  invalidObjectFormat , true), expected);
    });
  });

  after(function() {
    envcloak.reset();
    issueInspector.reset();
  });
});
