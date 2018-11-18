'use strict';

var lab = require('../index');
var Devebot = lab.getDevebot();
var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');
var chores = Devebot.require('chores');
var debugx = Devebot.require('pinbug')('tdd:devebot:core:object-decorator');
var assert = require('chai').assert;
var path = require('path');
var util = require('util');
var LogAdapter = require('logolite').LogAdapter;
var LogConfig = require('logolite').LogConfig;
var LogTracer = require('logolite').LogTracer;
var envmask = require('envmask').instance;
var rewire = require('rewire');
var sinon = require('sinon');

describe('tdd:devebot:core:object-decorator', function() {
  this.timeout(lab.getDefaultTimeout());

  before(function() {
    envmask.setup({
      LOGOLITE_ALWAYS_ENABLED: 'all',
      // LOGOLITE_ALWAYS_MUTED: 'all'
    });
    LogConfig.reset();
  });

  describe('wrapMethod()', function() {
    var ObjectDecorator = rewire(lab.getDevebotModule('backbone/object-decorator'));
    var wrapMethod = ObjectDecorator.__get__('wrapMethod');

    it('should wrap a method without texture correctly', function() {
      var originalMethod = sinon.stub();
      var wrappedMethod = wrapMethod({}, originalMethod);
      var result = wrappedMethod({ msg: 'Hello world' }, { reqId: LogConfig.getLogID() });
      assert.equal(originalMethod.callCount, 1);
      assert.equal(originalMethod.firstCall.args.length, 2);
      assert.deepEqual(originalMethod.firstCall.args[0], { msg: 'Hello world' });
      assert.hasAllKeys(originalMethod.firstCall.args[1], ['reqId']);
    });

    it('should wrap logging for a general method correctly', function() {
      var context = {
        L: LogAdapter.getLogger(),
        T: LogTracer.ROOT
      }
      var object = {
        sampleMethod: sinon.stub().callsFake(function() {
          return {
            description: "Echo message",
            parameters: arguments[0]
          };
        })
      }
      var texture = {
        methodType: 'general',
        logging: {
          onRequest: {
            extractReqId: function(args, context) {
              return args && args[1] && args[1].reqId;
            },
            extractInfo: function(args, context) {
              return args[0];
            },
            template: "#{objectName}.#{methodName} - #{parameters} - Request[#{requestId}]"
          },
          onSuccess: {
            extractInfo: function(result) {
              return result;
            },
            template: "#{objectName}.#{methodName} - #{output} - Request[#{requestId}]"
          },
          onFailure: {
            extractInfo: function(error) {
              return {
                error_code: error.code,
                error_message: error.message
              }
            },
            template: "#{objectName}.#{methodName} - #{output} - Request[#{requestId}]"
          }
        }
      }
      var wrappedMethod = wrapMethod(context, object.sampleMethod, texture, {
        object: object,
        objectName: 'sampleObject',
        methodName: 'sampleMethod'
      });
      var output = wrappedMethod({ msg: 'Welcome to devebot' }, { reqId: LogConfig.getLogID() });
      assert.equal(object.sampleMethod.callCount, 1);
      assert.equal(object.sampleMethod.firstCall.args.length, 2);
      assert.deepEqual(object.sampleMethod.firstCall.args[0], { msg: 'Welcome to devebot' });
      assert.hasAllKeys(object.sampleMethod.firstCall.args[1], ['reqId']);
    });

    it('should wrap logging for a promise method correctly', function(done) {
      var context = {
        L: LogAdapter.getLogger(),
        T: LogTracer.ROOT
      }
      var object = {
        sampleMethod: sinon.stub().callsFake(function() {
          return Promise.resolve(arguments[0]);
        })
      }
      var texture = {
        methodType: 'promise',
        logging: {
          enabled: true,
          onRequest: {
            enabled: true,
            extractReqId: function(args, context) {
              return args && args[1] && args[1].reqId;
            },
            extractInfo: function(args, context) {
              return args[0];
            },
            template: "#{objectName}.#{methodName} - #{parameters} - Request[#{requestId}]"
          },
          onSuccess: {
            extractInfo: function(result) {
              return result;
            },
            template: "#{objectName}.#{methodName} - #{output} - Request[#{requestId}]"
          },
          onFailure: {
            extractInfo: function(error) {
              return {
                error_code: error.code,
                error_message: error.message
              }
            },
            template: "#{objectName}.#{methodName} - #{output} - Request[#{requestId}]"
          }
        }
      };
      var wrappedMethod = wrapMethod(context, object.sampleMethod, texture, {
        object: object,
        objectName: 'sampleObject',
        methodName: 'sampleMethod'
      });
      var p = wrappedMethod({ msg: 'Welcome to devebot' }, { reqId: LogConfig.getLogID() });
      p = p.then(function(result) {
        assert.equal(object.sampleMethod.callCount, 1);
        assert.equal(object.sampleMethod.firstCall.args.length, 2);
        assert.deepEqual(object.sampleMethod.firstCall.args[0], { msg: 'Welcome to devebot' });
        assert.hasAllKeys(object.sampleMethod.firstCall.args[1], ['reqId']);
        return null;
      })
      p.asCallback(done);
    });

    it('should wrap logging for a callback method correctly', function(done) {
      var texture = {
        methodType: 'callback',
        logging: {
          enabled: true,
          onRequest: {
            enabled: true,
            extractReqId: function(args, context) {
              return args && args[1] && args[1].reqId;
            },
            extractInfo: function(args, context) {
              return args[0];
            },
            template: "#{objectName}.#{methodName} - #{parameters} - Request[#{requestId}]"
          },
          onSuccess: {
            extractInfo: function(result) {
              return result;
            },
            template: "#{objectName}.#{methodName} - #{output} - Request[#{requestId}]"
          },
          onFailure: {
            extractInfo: function(error) {
              return {
                error_code: error.code,
                error_message: error.message
              }
            },
            template: "#{objectName}.#{methodName} - #{output} - Request[#{requestId}]"
          }
        }
      };
      var object = {
        sampleMethod: sinon.stub().callsFake(function() {
          let cb = arguments[arguments.length - 1];
          cb(null, { msg: "This is a normal result" });
        })
      }
      var wrappedMethod = wrapMethod({
        L: LogAdapter.getLogger(),
        T: LogTracer.ROOT
      }, object.sampleMethod, texture, {
        object: object,
        objectName: 'sampleObject',
        methodName: 'sampleMethod'
      });
      wrappedMethod({ msg: 'Welcome to devebot' }, { reqId: LogConfig.getLogID() }, function(err, value) {
        done(err, value);
      });
    });
  });

  describe('wrapObject()', function() {
    var ObjectDecorator = rewire(lab.getDevebotModule('backbone/object-decorator'));
    var wrapObject = ObjectDecorator.__get__('wrapObject');

    it('should wrap all of public methods of a bean with empty textureStore', function() {
      var context = {};
      var textureStore = {};
      var mockedBean = {
        method1: sinon.stub(),
        method2: sinon.stub()
      }
      var originalBean = lodash.clone(mockedBean);
      var wrappedBean = wrapObject(context, textureStore, originalBean, {
        objectName: 'originalBean'
      });
      // invoke method1() 3 times
      lodash.range(3).forEach(function() {
        wrappedBean.method1();
      })
      assert.equal(mockedBean.method1.callCount, 3);
      // invoke method1() 2 times
      lodash.range(2).forEach(function() {
        wrappedBean.method2();
      })
      assert.equal(mockedBean.method2.callCount, 2);
    });

    it('should wrap all of public methods of a bean', function() {
      var pluginCTX = {
        L: LogAdapter.getLogger(),
        T: LogTracer.ROOT,
        moduleType: 'plugin'
      }
      var textureStore = {
        plugins: {
          "simple-plugin": {
            services: {
              originalBean: {
                method1: {
                  methodType: 'normal', // promise, callback, normal
                  logging: {
                    enabled: true,
                    onRequest: {
                      enabled: true,
                      extractReqId: function(args, context) {
                        return args && args[1] && args[1].reqId;
                      },
                      extractInfo: function(args, context) {
                        return args[0];
                      },
                      template: "#{objectName}.#{methodName} - #{parameters} - Request[#{requestId}]"
                    },
                    onSuccess: {
                      extractInfo: function(result) {
                        return result;
                      },
                      template: "#{objectName}.#{methodName} - #{output} - Request[#{requestId}]"
                    },
                    onFailure: {
                      extractInfo: function(error) {
                        return {
                          error_code: error.code,
                          error_message: error.message
                        }
                      },
                      template: "#{objectName}.#{methodName} - #{output} - Request[#{requestId}]"
                    }
                  }
                }
              }
            }
          }
        }
      }
      var mockedBean = {
        method1: sinon.stub(),
        method2: sinon.stub()
      }
      var originalBean = lodash.clone(mockedBean);
      var wrappedBean = wrapObject(pluginCTX, textureStore, originalBean, {
        pluginCode: 'simple-plugin',
        gadgetType: 'services',
        objectName: 'originalBean'
      });
      lodash.range(3).forEach(function() {
        wrappedBean.method1('Hello world', {
          reqId: LogConfig.getLogID()
        });
      });
      assert.equal(mockedBean.method1.callCount, 3);
    });
  });

  describe('wrapPluginGadget()', function() {
    it('should wrap all of public methods of a bean', function() {
      var objectDecorator = lab.createObjectDecorator('fullapp', {
        textureNames: ['default'],
        textureConfig: {}
      });
      
      var originalBean = {
        method1: sinon.stub(),
        method2: sinon.stub()
      }
      
      var wrappedBean = objectDecorator.wrapPluginGadget(lodash.clone(originalBean), {
        objectName: 'originalBean'
      });

      // invoke method1() 3 times
      lodash.range(3).forEach(function() {
        wrappedBean.method1();
      })
      assert.equal(originalBean.method1.callCount, 3);

      // invoke method1() 2 times
      lodash.range(2).forEach(function() {
        wrappedBean.method2();
      })
      assert.equal(originalBean.method2.callCount, 2);
    });
  });

  describe('MethodExecutor', function() {
    var ObjectDecorator = rewire(lab.getDevebotModule('backbone/object-decorator'));
    var MethodExecutor = ObjectDecorator.__get__('MethodExecutor');

    function _verify_tracer(tracer, opts) {
      assert.equal(tracer.add.callCount, 2);
      assert.lengthOf(tracer.add.firstCall.args, 1);
      assert.deepEqual(tracer.add.firstCall.args[0], opts.add.logState);
      assert.lengthOf(tracer.add.secondCall.args, 1);
      assert.deepEqual(tracer.add.secondCall.args[0], opts.add.logState);
      tracer.add.resetHistory();
      assert.equal(tracer.toMessage.callCount, 2);
      assert.lengthOf(tracer.toMessage.firstCall.args, 1);
      assert.deepEqual(tracer.toMessage.firstCall.args[0], opts.toMessage.firstCallArgs);
      assert.lengthOf(tracer.toMessage.secondCall.args, 1);
      assert.deepEqual(tracer.toMessage.secondCall.args[0], opts.toMessage.secondCallArgs);
      tracer.toMessage.resetHistory();
    }

    function _test_MethodExcecutor_run(params, scenarios) {
      if (!lodash.isArray(scenarios)) {
        scenarios = [scenarios];
      }
      var texture = {
        logging: {
          onRequest: {
            extractReqId: function(args, context) {
              return args && args[1] && args[1].reqId;
            },
            extractInfo: function(args, context) {
              return args[0];
            },
            template: "#{objectName}.#{methodName} - Request[#{requestId}] is invoked"
          },
          onSuccess: {
            extractInfo: function(value, args) {
              return value;
            },
            template: "#{objectName}.#{methodName} - Request[#{requestId}] has finished"
          },
          onFailure: {
            extractInfo: function(error, args) {
              return {
                error_code: error.code,
                error_message: error.message
              }
            },
            template: "#{objectName}.#{methodName} - Request[#{requestId}] has failed"
          }
        }
      }

      if (params.methodMode === 'explicit') {
        texture.methodType = params.methodType;
      }

      var object = {}
      switch(params.methodType) {
        case 'promise': {
          object.sampleMethod = sinon.stub().callsFake(function(data, opts) {
            opts = opts || {};
            let scenario = scenarios[opts.index];
            if (scenario.output.error) {
              return Promise.reject(scenario.output.error);
            }
            return Promise.resolve(scenario.output.value);
          });
          break;
        }
        case 'callback': {
          object.sampleMethod = sinon.stub().callsFake(function(data, opts) {
            opts = opts || {};
            let scenario = scenarios[opts.index];
            let cb = arguments[arguments.length - 1];
            cb(scenario.output.error, scenario.output.value);
          });
          break;
        }
        case 'general': {
          object.sampleMethod = sinon.stub().callsFake(function(data, opts) {
            opts = opts || {};
            let scenario = scenarios[opts.index];
            if (scenario.output.error) {
              throw scenario.output.error;
            }
            return scenario.output.value;
          });
          break;
        }
      }

      var logger = {
        has: sinon.stub().returns(true),
        log: sinon.stub()
      }

      var tracer = {
        add: sinon.stub().callsFake(function(params) {
          LogTracer.ROOT.add(params);
          return tracer;
        }),
        toMessage: sinon.stub().callsFake(function(params) {
          return LogTracer.ROOT.toMessage(params);
        })
      };

      var executor = new MethodExecutor({
        object: object,
        objectName: params.methodType + 'Mode',
        method: object.sampleMethod,
        methodName: 'sampleMethod',
        texture: texture,
        logger: logger,
        tracer: tracer
      });

      var state = {
        methodType: undefined,
        counter: { promise: 0, callback: 0, general: 0 },
        pointer: { current: null, actionFlow: params.methodMode }
      }

      switch(params.methodMode) {
        case 'explicit': {
          state.methodType = params.methodType;
          break;
        }
        case 'implicit': {
          state.counter[params.methodType] = scenarios.length;
          state.pointer.current = params.methodType;
        }
      }

      let p = Promise.each(scenarios, function(scenario, index) {
        let tracerOutput = lodash.merge({
          add: {
            logState: {
              actionFlow: params.methodMode,
              objectName: params.methodType + 'Mode',
              methodName: 'sampleMethod',
              requestId: scenario.requestId
            }
          },
          toMessage: {
            firstCallArgs: {
              text: '#{objectName}.#{methodName} - Request[#{requestId}] is invoked'
            },
            secondCallArgs: {
              text: (function(isError) {
                if (isError) {
                  return '#{objectName}.#{methodName} - Request[#{requestId}] has failed'
                } else {
                  return '#{objectName}.#{methodName} - Request[#{requestId}] has finished'
                }
              })(scenario.output.error != null)
            }
          }
        }, scenario.tracer);

        var parameters = lodash.concat(scenario.input, [{ reqId: scenario.requestId, index }]);

        if (params.methodType === 'callback') {
          return new Promise(function(onResolved, onRejected) {
            parameters.push(function (err, value) {
              if (scenario.output.error == null) {
                assert.isNull(err);
                assert.deepEqual(value, scenario.output.value);
              } else {
                assert.deepEqual(err, scenario.output.error);
                assert.deepEqual(value, scenario.output.value);
              }
              _verify_tracer(tracer, tracerOutput);
              onResolved();
            });
            var result = executor.run(parameters);
            assert.isUndefined(result);
          });
        }
        if (params.methodType === 'promise') {
          var result = executor.run(parameters);
          let flow = null;
          if (!scenario.output.error) {
            flow = result.then(function (value) {
              assert.deepEqual(value, scenario.output.value);
            });
          } else {
            flow = result.then(function(value) {
              return Promise.reject();
            }).catch(function(error) {
              return Promise.resolve();
            })
          }
          flow.then(function() {
            _verify_tracer(tracer, tracerOutput);
          });
          return flow;
        }
        if (params.methodType === 'general') {
          var result = undefined, exception = undefined;
          try {
            result = executor.run(parameters);
          } catch (error) {
            exception = error;
          }
          _verify_tracer(tracer, tracerOutput);
          if (!scenario.output.error) {
            assert.isUndefined(exception);
            assert.deepEqual(result, scenario.output.value);
          } else {
            assert.isUndefined(result);
          }
          return result;
        }
      });

      p = p.then(function() {
        state = lodash.merge(state, params.state);
        assert.deepInclude(executor.__state__, state);
      })

      return p;
    }

    it('invokes the wrapped method in [promise] mode if the method returns a promise (success)', function() {
      return _test_MethodExcecutor_run({
        methodMode: 'implicit',
        methodType: 'promise'
      }, {
        requestId: 'YkMjPoSoSyOTrLyf76Mzqg',
        input: ['Hello world'],
        output: {
          error: null,
          value: { msg: "This is a normal result" }
        },
        tracer: {
          add: {
            logState: {
              requestId: 'YkMjPoSoSyOTrLyf76Mzqg'
            }
          },
          toMessage: {
            firstCallArgs: {
              info: 'Hello world'
            },
            secondCallArgs: {
              info: { msg: "This is a normal result" }
            }
          }
        }
      });
    });

    it('invokes the wrapped method in [promise] mode if the method returns a promise (failure)', function() {
      return _test_MethodExcecutor_run({
        methodMode: 'implicit',
        methodType: 'promise'
      }, {
        requestId: 'YkMjPoSoSyOTrLyf76Mzqg',
        input: ['Hello world'],
        output: {
          error: new Error('The action has been failed'),
          value: { msg: "Anything" }
        },
        tracer: {
          add: {
            logState: {
              requestId: 'YkMjPoSoSyOTrLyf76Mzqg'
            }
          },
          toMessage: {
            firstCallArgs: {
              info: 'Hello world'
            },
            secondCallArgs: {
              info: {
                "error_code": undefined,
                "error_message": "The action has been failed"
              }
            }
          }
        }
      });
    });

    it('invokes the wrapped method in [callback] mode if parameter includes a callback (success)', function() {
      return _test_MethodExcecutor_run({
        methodMode: 'implicit',
        methodType: 'callback'
      }, {
        requestId: 'YkMjPoSoSyOTrLyf76Mzqg',
        input: ['Hello world'],
        output: {
          error: null,
          value: { msg: "This is a normal result" }
        },
        tracer: {
          add: {
            logState: {
              requestId: 'YkMjPoSoSyOTrLyf76Mzqg'
            }
          },
          toMessage: {
            firstCallArgs: {
              info: 'Hello world'
            },
            secondCallArgs: {
              info: { msg: "This is a normal result" }
            }
          }
        }
      });
    });

    it('invokes the wrapped method in [callback] mode if parameter includes a callback (failure)', function() {
      return _test_MethodExcecutor_run({
        methodMode: 'implicit',
        methodType: 'callback'
      }, {
        requestId: 'YkMjPoSoSyOTrLyf76Mzqg',
        input: ['Hello world'],
        output: {
          error: new Error('The action has been failed'),
          value: { msg: "Anything" }
        },
        tracer: {
          add: {
            logState: {
              requestId: 'YkMjPoSoSyOTrLyf76Mzqg'
            }
          },
          toMessage: {
            firstCallArgs: {
              info: 'Hello world'
            },
            secondCallArgs: {
              info: {
                "error_code": undefined,
                "error_message": "The action has been failed"
              }
            }
          }
        }
      });
    });

    it('invokes the wrapped method in [general] mode if the method returns a normal result (success)', function() {
      return _test_MethodExcecutor_run({
        methodMode: 'implicit',
        methodType: 'general'
      }, {
        requestId: 'YkMjPoSoSyOTrLyf76Mzqg',
        input: ['Hello world'],
        output: {
          error: null,
          value: { msg: "This is a normal result" }
        },
        tracer: {
          add: {
            logState: {
              requestId: 'YkMjPoSoSyOTrLyf76Mzqg'
            }
          },
          toMessage: {
            firstCallArgs: {
              info: 'Hello world'
            },
            secondCallArgs: {
              info: { msg: "This is a normal result" }
            }
          }
        }
      });
    });

    it('invokes the wrapped method in [general] mode if the method returns a normal result (failure)', function() {
      return _test_MethodExcecutor_run({
        methodMode: 'implicit',
        methodType: 'general'
      }, {
        requestId: 'YkMjPoSoSyOTrLyf76Mzqg',
        input: ['Hello world'],
        output: {
          error: new Error('The action has been failed'),
          value: { msg: "Anything" }
        },
        tracer: {
          add: {
            logState: {
              requestId: 'YkMjPoSoSyOTrLyf76Mzqg'
            }
          },
          toMessage: {
            firstCallArgs: {
              info: 'Hello world'
            },
            secondCallArgs: {
              info: {
                "error_code": undefined,
                "error_message": "The action has been failed"
              }
            }
          }
        }
      });
    });

    it('explicitly specified methodType (promise) will skip _detect() and call _invoke() in promise mode', function() {
      return _test_MethodExcecutor_run({
        methodMode: 'explicit',
        methodType: 'promise'
      }, {
        requestId: 'YkMjPoSoSyOTrLyf76Mzqg',
        input: ['Hello world'],
        output: {
          error: null,
          value: { msg: "This is a normal result" }
        },
        tracer: {
          add: {
            logState: {
              requestId: 'YkMjPoSoSyOTrLyf76Mzqg'
            }
          },
          toMessage: {
            firstCallArgs: {
              info: 'Hello world'
            },
            secondCallArgs: {
              info: { msg: "This is a normal result" }
            }
          }
        }
      });
    });

    it('explicitly specified methodType (promise) will skip _detect() and call _invoke() in promise mode (error)', function() {
      return _test_MethodExcecutor_run({
        methodMode: 'explicit',
        methodType: 'promise'
      }, {
        requestId: 'YkMjPoSoSyOTrLyf76Mzqg',
        input: ['Hello world'],
        output: {
          error: new Error('The action has been failed'),
          value: { msg: "Anything" }
        },
        tracer: {
          add: {
            logState: {
              requestId: 'YkMjPoSoSyOTrLyf76Mzqg'
            }
          },
          toMessage: {
            firstCallArgs: {
              info: 'Hello world'
            },
            secondCallArgs: {
              info: {
                "error_code": undefined,
                "error_message": "The action has been failed"
              }
            }
          }
        }
      });
    });

    it('explicitly specified methodType (callback) will skip _detect() and call _invoke() in callback mode', function() {
      return _test_MethodExcecutor_run({
        methodMode: 'explicit',
        methodType: 'callback'
      }, {
        requestId: 'YkMjPoSoSyOTrLyf76Mzqg',
        input: ['Hello world'],
        output: {
          error: null,
          value: { msg: "This is a normal result" }
        },
        tracer: {
          add: {
            logState: {
              requestId: 'YkMjPoSoSyOTrLyf76Mzqg'
            }
          },
          toMessage: {
            firstCallArgs: {
              info: 'Hello world'
            },
            secondCallArgs: {
              info: { msg: "This is a normal result" }
            }
          }
        }
      });
    });

    it('explicitly specified methodType (callback) will skip _detect() and call _invoke() in callback mode (error)', function() {
      return _test_MethodExcecutor_run({
        methodMode: 'explicit',
        methodType: 'callback'
      }, {
        requestId: 'YkMjPoSoSyOTrLyf76Mzqg',
        input: ['Hello world'],
        output: {
          error: new Error('The action has been failed'),
          value: { msg: "Anything" }
        },
        tracer: {
          add: {
            logState: {
              requestId: 'YkMjPoSoSyOTrLyf76Mzqg'
            }
          },
          toMessage: {
            firstCallArgs: {
              info: 'Hello world'
            },
            secondCallArgs: {
              info: {
                "error_code": undefined,
                "error_message": "The action has been failed"
              }
            }
          }
        }
      });
    });

    it('explicitly specified methodType (general) will skip _detect() and call _invoke() in general mode', function() {
      return _test_MethodExcecutor_run({
        methodMode: 'explicit',
        methodType: 'general'
      }, {
        requestId: 'YkMjPoSoSyOTrLyf76Mzqg',
        input: ['Hello world'],
        output: {
          error: null,
          value: { msg: "This is a normal result" }
        },
        tracer: {
          add: {
            logState: {
              requestId: 'YkMjPoSoSyOTrLyf76Mzqg'
            }
          },
          toMessage: {
            firstCallArgs: {
              info: 'Hello world'
            },
            secondCallArgs: {
              info: { msg: "This is a normal result" }
            }
          }
        }
      });
    });

    it('explicitly specified methodType (general) will skip _detect() and call _invoke() in general mode (error)', function() {
      return _test_MethodExcecutor_run({
        methodMode: 'explicit',
        methodType: 'general'
      }, {
        requestId: 'YkMjPoSoSyOTrLyf76Mzqg',
        input: ['Hello world'],
        output: {
          error: new Error('The action has been failed'),
          value: { msg: "Anything" }
        },
        tracer: {
          add: {
            logState: {
              requestId: 'YkMjPoSoSyOTrLyf76Mzqg'
            }
          },
          toMessage: {
            firstCallArgs: {
              info: 'Hello world'
            },
            secondCallArgs: {
              info: {
                "error_code": undefined,
                "error_message": "The action has been failed"
              }
            }
          }
        }
      });
    });

    it('auto-detecting methodType (promise) will be stable after reliable number of continual steps', function() {
      return _test_MethodExcecutor_run({
        methodMode: 'implicit',
        methodType: 'general'
      }, [{
        requestId: 'YkMjPoSoSyOTrLyf76Mzqg',
        input: ['Hello world'],
        output: {
          error: null,
          value: { msg: "This is a normal result" }
        },
        tracer: {
          toMessage: {
            firstCallArgs: {
              info: 'Hello world'
            },
            secondCallArgs: {
              info: { msg: "This is a normal result" }
            }
          }
        }
      }, {
        requestId: 'YkMjPoSoSyOTrLyf76Mzqh',
        input: ['Hello world'],
        output: {
          error: new Error('The action has been failed'),
          value: { msg: "Anything" }
        },
        tracer: {
          toMessage: {
            firstCallArgs: {
              info: 'Hello world'
            },
            secondCallArgs: {
              info: {
                "error_code": undefined,
                "error_message": "The action has been failed"
              }
            }
          }
        }
      }]);
    });

    it('auto-detecting methodType (callback) will be stable after reliable number of continual steps');

    it('auto-detecting methodType (gegeral) will be stable after reliable number of continual steps');
  });

  after(function() {
    LogTracer.clearInterceptors();
    envmask.reset();
  });
});
