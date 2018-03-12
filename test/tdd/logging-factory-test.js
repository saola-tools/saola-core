'use strict';

var lab = require('../index');
var Devebot = lab.getDevebot();
var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');
var debugx = Devebot.require('pinbug')('tdd:devebot:core:logging-factory');
var assert = require('chai').assert;
var expect = require('chai').expect;
var path = require('path');
var util = require('util');
var LoggingFactory = require('../../lib/backbone/logging-factory');
var LogAdapter = require('logolite').LogAdapter;
var MockLogger = require('logolite').MockLogger;
var envtool = require('logolite/envtool');
var rewire = require('rewire');

describe('tdd:devebot:core:logging-factory', function() {

  describe('logging backward compatible', function() {
    var LoggingFactory = rewire('../../lib/backbone/logging-factory');
    var transformLoggingLabels = LoggingFactory.__get__('transformLoggingLabels');
    assert.isNotNull(transformLoggingLabels);
    
    before(function() {
      envtool.setup({
        LOGOLITE_ALWAYS_MUTED: 'all'
      });
    });

    beforeEach(function() {
      LoggingFactory.reset();
    });

    it('transformLoggingLabels() accept null parameter', function() {
      var output = transformLoggingLabels(null);
      false && console.log('transformLoggingLabels(): ', output);
      assert.deepEqual(output, {});
    });

    it('transformLoggingLabels() accept empty parameter', function() {
      var output = transformLoggingLabels({});
      false && console.log('transformLoggingLabels(): ', output);
      assert.deepEqual(output, {});
    });

    it('transformLoggingLabels() transform logging labels correctly', function() {
      var loggerCfg = {
        labels: {
          verbose: {
            level: 6,
            color: 'magenta',
            inflow: 'silly'
          },
          debug: {
            level: 5,
            color: 'blue',
            inflow: 'debug'
          },
          info: {
            level: 4,
            color: 'cyan',
            inflow: 'trace'
          },
          trace: {
            level: 3,
            color: 'green',
            inflow: 'info'
          },
          warn: {
            level: 2,
            color: 'yellow',
            inflow: 'warn'
          },
          error: {
            level: 1,
            color: 'red',
            inflow: 'error'
          },
          fatal: {
            level: 0,
            color: 'orange'
          }
        }
      }

      var expected = {
        levels: {
          verbose: 6,
          debug: 5,
          info: 4,
          trace: 3,
          warn: 2,
          error: 1,
          fatal: 0
        },
        colors: {
          verbose: 'magenta',
          debug: 'blue',
          info: 'cyan',
          trace: 'green',
          warn: 'yellow',
          error: 'red',
          fatal: 'orange'
        },
        mappings: {
          silly: 'verbose',
          debug: 'debug',
          trace: 'info',
          info: 'trace',
          warn: 'warn',
          error: 'error'
        }
      }

      var output = transformLoggingLabels(loggerCfg.labels);
      false && console.log('transformLoggingLabels(): ', output);
      assert.deepEqual(output, expected);
    });

    it('old logging messages are mapped to new logging labels', function() {
      var factory = new LoggingFactory({
        profileConfig: {
          logger: {
            labels: {
              level_s: {
                level: 5,
                color: 'magenta',
                inflow: 'silly'
              },
              level_d: {
                level: 4,
                color: 'blue',
                inflow: 'debug'
              },
              level_i: {
                level: 3,
                color: 'cyan',
                inflow: 'info'
              },
              level_t: {
                level: 2,
                color: 'green',
                inflow: 'trace'
              },
              level_w: {
                level: 1,
                color: 'yellow',
                inflow: 'warn'
              },
              level_e: {
                level: 0,
                color: 'red',
                inflow: ['error', 'fatal']
              }
            },
            transports: {
              console: {
                type: 'console',
                level: 'level_d',
                json: false,
                timestamp: true,
                colorize: true
              }
            }
          }
        }
      });

      var rootTracer = factory.getTracer();
      var rootLogger = factory.getLogger();
      var mockLogger = new MockLogger({
        levels: {
          level_s: 5,
          level_d: 4,
          level_i: 3,
          level_t: 2,
          level_w: 1,
          level_e: 0
        },
        level: 'level_i'
      });
      LogAdapter.addInterceptor(mockLogger);

      rootLogger.log('silly', 'Silly message #1');
      rootLogger.log('error', 'Error message #1');
      rootLogger.log('error', 'Error message #2');
      rootLogger.log('trace', 'Trace message #1');
      rootLogger.log('fatal', 'Error message #3');

      var msgs = mockLogger._reset();
      false && console.log(JSON.stringify(msgs, null, 2));

      assert.deepEqual(msgs, [
        {
          "severity": "level_e",
          "payload": "Error message #1"
        },
        {
          "severity": "level_e",
          "payload": "Error message #2"
        },
        {
          "severity": "level_t",
          "payload": "Trace message #1"
        },
        {
          "severity": "level_e",
          "payload": "Error message #3"
        }
      ]);
    });

    after(function() {
      envtool.reset();
    });
  });

  describe('extend Tracer using branch() method', function() {

    before(function() {
      envtool.setup({
        LOGOLITE_ALWAYS_MUTED: 'all'
      });
    });

    beforeEach(function() {
      LoggingFactory.reset();
    });

    it('default Tracer must contain framework information', function() {
      var mockLogger = new MockLogger();
      LogAdapter.clearInterceptors().addInterceptor(mockLogger);

      var factory = new LoggingFactory({
        logger: {
          transports: {
            console: {
              type: 'console',
              level: 'debug',
              json: false,
              timestamp: true,
              colorize: true
            }
          }
        }
      });

      var rootTracer = factory.getTracer();

      var queue = mockLogger._reset();

      assert.equal(queue.length, 2);
      queue.forEach(function(item) {
        item.payload = JSON.parse(item.payload);
      });
      assert.equal(lodash.get(queue, [1, 'payload', 'blockName']), 'devebot');

      var logObject_1 = rootTracer.toMessage();
      assert.deepEqual(
        lodash.pick(JSON.parse(logObject_1), ['instanceId', 'blockId']),
        lodash.pick(lodash.get(queue, [1, 'payload']), ['instanceId', 'blockId'])
      );
    });

    it('recursive branch() calls will return hierarchical loggingFactory objects', function() {
      var mockLogger = new MockLogger();
      LogAdapter.clearInterceptors().addInterceptor(mockLogger);

      var factory = new LoggingFactory({
        logger: {
          transports: {
            console: {
              type: 'console',
              level: 'debug',
              json: false,
              timestamp: true,
              colorize: true
            }
          }
        }
      });

      var childFactory1 = factory.branch('child1');
      var childFactory2 = factory.branch('child2');
      var factory_2_1 = childFactory2.branch('grand-child-1');
      var factory_2_2 = childFactory2.branch('grand-child-2');

      var logObject_1 = childFactory1.getTracer().toMessage();

      var queue = mockLogger._reset();

      assert.equal(queue.length, 2 + 4);
      queue.forEach(function(item) {
        item.payload = JSON.parse(item.payload);
      });

      var logObject_2 = childFactory2.getTracer().toMessage();
      var logObject_2_1 = factory_2_1.getTracer().toMessage();
      var logObject_2_2 = factory_2_2.getTracer().toMessage();

      assert.isTrue(factory.getLogger() === factory.getLogger());
      assert.isTrue(factory.getTracer() === factory.getTracer());

      assert.isTrue(factory.getTracer() !== childFactory1.getTracer());
      assert.isTrue(factory.getLogger() !== childFactory1.getLogger());
      assert.isTrue(factory.getTracer() !== factory_2_1.getTracer());
      assert.isTrue(factory.getLogger() !== factory_2_1.getLogger());

      assert.equal(lodash.get(queue, [1, 'payload', 'blockName']), 'devebot');
      assert.equal(lodash.get(queue, [2, 'payload', 'blockName']), 'child1');
      assert.equal(lodash.get(queue, [3, 'payload', 'blockName']), 'child2');
      assert.equal(lodash.get(queue, [4, 'payload', 'blockName']), 'grand-child-1');
      assert.equal(lodash.get(queue, [5, 'payload', 'blockName']), 'grand-child-2');

      assert.deepEqual(
        lodash.pick(JSON.parse(logObject_1), ['instanceId', 'blockId']),
        lodash.pick(lodash.get(queue, [2, 'payload']), ['instanceId', 'blockId'])
      );

      assert.deepEqual(
        lodash.pick(JSON.parse(logObject_2), ['instanceId', 'blockId']),
        lodash.pick(lodash.get(queue, [3, 'payload']), ['instanceId', 'blockId'])
      );
    });

    after(function() {
      envtool.reset();
    });
  });
});
