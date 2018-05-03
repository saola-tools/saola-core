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
          state: 'error',
          payload: null,
          expected: {
            state: constx.WEBSOCKET.STATE.ERROR,
            message: constx.WEBSOCKET.MSG_ON.ERROR
          }
        },
        {
          state: 'definition',
          payload: {
            value: {
              text: 'Any message'
            }
          },
          expected: {
            state: 'definition',
            value: {
              text: 'Any message'
            }
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

  after(function() {
    envtool.reset();
    errorHandler.reset();
  });
});
