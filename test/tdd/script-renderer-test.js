'use strict';

var lab = require('../index');
var constx = require('../../lib/utils/constx');
var Devebot = lab.getDevebot();
var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');
var loader = Devebot.require('loader');
var debugx = Devebot.require('pinbug')('tdd:devebot:core:script-renderer');
var assert = require('chai').assert;
var path = require('path');
var util = require('util');
var LogAdapter = require('logolite').LogAdapter;
var LogConfig = require('logolite').LogConfig;
var LogTracer = require('logolite').LogTracer;
var envtool = require('logolite/envtool');
var errorHandlerPath = path.join(lab.getDevebotHome(), 'lib/backbone/error-handler');
var errorHandler = require(errorHandlerPath).instance;
var rewire = require('rewire');
var sinon = require('sinon');

describe('tdd:devebot:core:script-renderer', function() {
  this.timeout(lab.getDefaultTimeout());

  var {loggingFactory, schemaValidator} = lab.createBasicServices();

  before(function() {
    envtool.setup({
      NODE_ENV: 'test',
      LOGOLITE_ALWAYS_ENABLED: 'all',
      LOGOLITE_ALWAYS_MUTED: 'all'
    });
    LogConfig.reset();
    errorHandler.reset();
  });

  describe('WebSocketOutlet', function() {
    var ScriptRenderer = rewire('../../lib/backbone/script-renderer');
    var WebSocketOutlet = ScriptRenderer.__get__('WebSocketOutlet');
    var ws = { send: function() {} };
    var outlet = new WebSocketOutlet({
        ws: ws,
        logger: loggingFactory.getLogger(),
        tracer: loggingFactory.getTracer(),
        schemaValidator: schemaValidator
      });
    var testSend = function(state, payload, expected) {
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
        outlet.render(state, payload);
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
          payload: {
            value: {
              text: 'Any Object'
            }
          },
          expected: {
            state: 'definition',
            value: {
              text: 'Any Object'
            }
          }
        },
        {
          state: 'error',
          payload: null,
          expected: {
            state: constx.WEBSOCKET.STATE.ERROR,
            message: constx.WEBSOCKET.MSG_ON.ERROR
          }
        },
        {
          state: 'started',
          payload: null,
          expected: {
            state: constx.WEBSOCKET.STATE.STARTED,
            message: constx.WEBSOCKET.MSG_ON.STARTED
          }
        },
        {
          state: 'cancelled',
          payload: null,
          expected: {
            state: constx.WEBSOCKET.STATE.CANCELLED,
            message: constx.WEBSOCKET.MSG_ON.CANCELLED
          }
        },
        {
          state: 'failed',
          payload: {
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
            details: [{
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
          payload: {
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
            details: [{
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
          payload: {
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
          payload: null,
          expected: {
            state: constx.WEBSOCKET.STATE.DONE
          }
        }
      ], function(item) {
        return testSend(item.state, item.payload, item.expected);
      }).asCallback(done);
    });

    after(function() {
      LogTracer.clearStringifyInterceptors();
    });
  });

  describe('standardizeOutput()', function() {
    var ScriptRenderer = rewire('../../lib/backbone/script-renderer');
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
    envtool.reset();
    errorHandler.reset();
  });
});
