'use strict';

var lab = require('../index');
var Devebot = lab.getDevebot();
var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');
var chores = Devebot.require('chores');
var debugx = Devebot.require('pinbug')('tdd:devebot:core:object-decorator');
var assert = require('chai').assert;
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

    var logger = {
      has: sinon.stub().returns(true),
      log: sinon.stub()
    }
    var tracerStore = { add: [], toMessage: [] }
    var tracer = {
      add: sinon.stub().callsFake(function(params) {
        tracerStore.add.push(lodash.cloneDeep(params));
        LogTracer.ROOT.add(params);
        return tracer;
      }),
      toMessage: sinon.stub().callsFake(function(params) {
        return LogTracer.ROOT.toMessage(params);
      })
    }
    var CTX = { L: logger, T: tracer }

    beforeEach(function() {
      logger.has.resetHistory();
      logger.log.resetHistory();
      tracer.add.resetHistory();
      tracer.toMessage.resetHistory();
      tracerStore.add.splice(0);
      tracerStore.toMessage.splice(0);
    })

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
      var wrappedMethod = wrapMethod(CTX, object.sampleMethod, {
        texture: texture,
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
      var wrappedMethod = wrapMethod(CTX, object.sampleMethod, {
        texture: texture,
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
      var wrappedMethod = wrapMethod(CTX, object.sampleMethod, {
        texture: texture,
        object: object,
        objectName: 'sampleObject',
        methodName: 'sampleMethod'
      });
      wrappedMethod({ msg: 'Welcome to devebot' }, { reqId: LogConfig.getLogID() }, function(err, value) {
        done(err, value);
      });
    });
  });

  describe('wrapConstructor()', function() {
    var ObjectDecorator = rewire(lab.getDevebotModule('backbone/object-decorator'));
    var wrapConstructor = ObjectDecorator.__get__('wrapConstructor');
    var wrapObject = sinon.stub().callsFake(function(refs, object, opts) {
      return object;
    });
    ObjectDecorator.__set__('wrapObject', wrapObject);

    beforeEach(function() {
      wrapObject.resetHistory();
    })

    it('should wrap a constructor that will be invoked as a constructor', function() {
      var refs = { L: {}, T: {} };
      var opts = { textureStore: {} };

      var ExampleConstructor = function () {}
      ExampleConstructor.prototype.method1 = sinon.stub().callsFake(function(str) {
        false && console.log(' - method1(%s)', JSON.stringify(arguments, null, 2));
        return "My name is '" + str + "'";
      });
      ExampleConstructor.prototype.method2 = sinon.stub().callsFake(function(name, ids) {
        false && console.log(' - method2(%s)', JSON.stringify(arguments, null, 2));
        return ids;
      });
      ExampleConstructor.argumentSchema = { "$id": "ExampleConstructor" };
      ExampleConstructor.referenceList = ['dependency'];
      ExampleConstructor = sinon.spy(ExampleConstructor);

      // compare wrapped constructor ~ original constructor
      var WrappedConstructor = wrapConstructor(refs, ExampleConstructor, opts);
      assert.notEqual(WrappedConstructor, ExampleConstructor);
      assert.equal(WrappedConstructor.prototype, ExampleConstructor.prototype);
      assert.equal(WrappedConstructor.argumentSchema, ExampleConstructor.argumentSchema);
      assert.equal(WrappedConstructor.referenceList, ExampleConstructor.referenceList);

      // create new instance
      var obj = new WrappedConstructor("Example", { enabled: true });
      assert.isFunction(obj.method1);
      assert.isFunction(obj.method2);
      assert.equal(obj.method1('Peter Pan'), "My name is 'Peter Pan'");
      assert.deepEqual(obj.method2('log', [1, 2, 3], {reqId: LogConfig.getLogID()}), [1, 2, 3]);

      // assert original constructor has been called
      assert.equal(ExampleConstructor.callCount, 1);
      assert.deepEqual(ExampleConstructor.firstCall.args, ["Example", { enabled: true }]);

      // assert wrapObject has been called with correct parameters
      assert.equal(wrapObject.callCount, 1);
      var wrapObject_args = wrapObject.firstCall.args;
      assert.deepEqual(wrapObject_args[0], refs);
      assert.isTrue(wrapObject_args[1] instanceof ExampleConstructor);
      assert.deepEqual(wrapObject_args[2], opts);
    });

    it('should wrap a constructor that will be invoked as a function', function() {
      var refs = { L: {}, T: {} };
      var opts = { textureStore: {} };

      var ExampleConstructor = function () {
        this.number = 100;
        this.string = 'Hello world';
      }
      ExampleConstructor.prototype.method1 = sinon.stub().callsFake(function(str) {
        false && console.log(' - method1(%s)', JSON.stringify(arguments, null, 2));
        return "My name is '" + str + "'";
      });
      ExampleConstructor.prototype.method2 = sinon.stub().callsFake(function(name, ids) {
        false && console.log(' - method2(%s)', JSON.stringify(arguments, null, 2));
        return ids;
      });
      ExampleConstructor.argumentSchema = { "$id": "ExampleConstructor" };
      ExampleConstructor.referenceList = ['dependency'];
      ExampleConstructor = sinon.spy(ExampleConstructor);

      // compare wrapped constructor ~ original constructor
      var ObjectBuilder = wrapConstructor(refs, ExampleConstructor, opts);
      assert.notEqual(ObjectBuilder, ExampleConstructor);
      assert.equal(ObjectBuilder.prototype, ExampleConstructor.prototype);
      assert.equal(ObjectBuilder.argumentSchema, ExampleConstructor.argumentSchema);
      assert.equal(ObjectBuilder.referenceList, ExampleConstructor.referenceList);

      // create new instance
      var wrapper = function(args) {
        return ObjectBuilder.apply(this, args);
      };
      wrapper.prototype = ObjectBuilder.prototype;
      var obj = new wrapper(["Example", { enabled: true }]);
      assert.isFunction(obj.method1);
      assert.isFunction(obj.method2);
      assert.equal(obj.method1('Peter Pan'), "My name is 'Peter Pan'");
      assert.deepEqual(obj.method2('log', [1, 2, 3], {reqId: LogConfig.getLogID()}), [1, 2, 3]);

      assert.equal(obj.number, 100);
      assert.equal(obj.string, 'Hello world');

      // assert original constructor has been called
      assert.equal(ExampleConstructor.callCount, 1);
      assert.deepEqual(ExampleConstructor.firstCall.args, ["Example", { enabled: true }]);

      // assert wrapObject has been called with correct parameters
      assert.equal(wrapObject.callCount, 1);
      var wrapObject_args = wrapObject.firstCall.args;
      assert.deepEqual(wrapObject_args[0], refs);
      assert.deepEqual(wrapObject_args[2], opts);

      // verify original object
      var wrappedObject = wrapObject_args[1];
      assert.isTrue(wrappedObject instanceof ExampleConstructor);
      assert.equal(wrappedObject.number, 100);
      assert.equal(wrappedObject.string, 'Hello world');
    });
  });

  describe('wrapObject()', function() {
    var ObjectDecorator = rewire(lab.getDevebotModule('backbone/object-decorator'));
    var wrapObject = ObjectDecorator.__get__('wrapObject');
    var wrapMethod = sinon.spy(ObjectDecorator.__get__('wrapMethod'));
    ObjectDecorator.__set__('wrapMethod', wrapMethod);

    var logger = {
      has: sinon.stub().returns(true),
      log: sinon.stub()
    }
    var tracerStore = { add: [], toMessage: [] }
    var tracer = {
      add: sinon.stub().callsFake(function(params) {
        tracerStore.add.push(lodash.cloneDeep(params));
        LogTracer.ROOT.add(params);
        return tracer;
      }),
      toMessage: sinon.stub().callsFake(function(params) {
        return LogTracer.ROOT.toMessage(params);
      })
    }
    var CTX = { L: logger, T: tracer }

    beforeEach(function() {
      logger.has.resetHistory();
      logger.log.resetHistory();
      tracer.add.resetHistory();
      tracer.toMessage.resetHistory();
      tracerStore.add.splice(0);
      tracerStore.toMessage.splice(0);
      wrapMethod.resetHistory();
    })

    it('should wrap all of public methods of a bean with empty textureStore', function() {
      var textureOfBean = {};
      var mockedBean = {
        method1: sinon.stub(),
        method2: sinon.stub()
      }
      var wrappedBean = wrapObject(CTX, mockedBean, {
        textureOfBean: textureOfBean,
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
      assert.equal(wrapMethod.callCount, Object.keys(mockedBean).length);
    });

    it('should wrap all of public methods of a bean', function() {
      var textureOfBean = {
        method1: {
          methodType: 'general', // promise, callback, general
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
      var mockedBean = {
        method1: sinon.stub(),
        method2: sinon.stub()
      }
      var wrappedBean = wrapObject(CTX, mockedBean, {
        textureOfBean: textureOfBean,
        objectName: 'originalBean'
      });
      lodash.range(3).forEach(function() {
        wrappedBean.method1('Hello world', {
          reqId: LogConfig.getLogID()
        });
      });
      assert.equal(mockedBean.method1.callCount, 3);
      assert.equal(wrapMethod.callCount, 1); // calls method1 only
    });

    it('should wrap deep located methods of a bean', function() {
      var methodTexture = {
        methodType: 'general', // promise, callback, general
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
      var textureOfBean = {
        level1: { method1: lodash.cloneDeep(methodTexture) },
        level2: { sub2: { method2: lodash.cloneDeep(methodTexture) } },
        level3: { sub3: { bean3: { method3: lodash.cloneDeep(methodTexture) } } }
      }
      var mockedBean = {
        level1: { method1: sinon.stub() },
        level2: { sub2: { method2: sinon.stub() } },
        level3: { sub3: { bean3: new (function() {
          this.rate = 1.1;
          this.method3 = function area(total) {
            return total * this.rate;
          }
        })()}}
      }
      var wrappedBean = wrapObject(CTX, mockedBean, {
        textureOfBean: textureOfBean,
        objectName: 'originalBean'
      });
      // invokes method1() 3 times
      lodash.range(3).forEach(function() {
        wrappedBean.level1.method1('Hello world', {
          reqId: LogConfig.getLogID()
         });
      });
      assert.equal(mockedBean.level1.method1.callCount, 3);
      // invokes method2() 5 times
      lodash.range(5).forEach(function() {
        wrappedBean.level2.sub2.method2('Hello world', {
          reqId: LogConfig.getLogID()
        });
      });
      assert.equal(mockedBean.level2.sub2.method2.callCount, 5);
      // invokes method3() 1 times
      lodash.range(1).forEach(function() {
        wrappedBean.level3.sub3.bean3.method3(100);
      });
      // verify wrapMethod()
      assert.equal(wrapMethod.callCount, 3); // calls method1 & method2
      //verify tracer
      let logState_method1 = tracerStore.add.filter(item => {
        return ('requestId' in item && item.methodName === 'method1');
      });
      assert.equal(logState_method1.length, 3 * 2);
      let logState_method2 = tracerStore.add.filter(item => {
        return ('requestId' in item && item.methodName === 'method2');
      });
      assert.equal(logState_method2.length, 5 * 2);
    });
  });

  describe('wrapPluginGadget()', function() {
    var logger = {
      has: sinon.stub().returns(true),
      log: sinon.stub()
    }
    var tracerStore = { add: [], toMessage: [] }
    var tracer = {
      add: sinon.stub().callsFake(function(params) {
        tracerStore.add.push(lodash.cloneDeep(params));
        LogTracer.ROOT.add(params);
        return tracer;
      }),
      toMessage: sinon.stub().callsFake(function(params) {
        return LogTracer.ROOT.toMessage(params);
      })
    }
    var loggingFactory = {
      branch: function(blockRef) { return loggingFactory },
      getLogger: function() { return logger },
      getTracer: function() { return tracer }
    }
    var nameResolver = lab.getNameResolver(['simple-plugin'], []);
    var issueInspector = {};
    var schemaValidator = {};

    beforeEach(function() {
      logger.has.resetHistory();
      logger.log.resetHistory();
      tracer.add.resetHistory();
      tracer.toMessage.resetHistory();
      tracerStore.add.splice(0);
      tracerStore.toMessage.splice(0);
    })

    it('should wrap all of methods of a plugin-gadget with empty textureStore', function() {
      var objectDecorator = lab.initBackboneService('object-decorator', {
        textureNames: ['default'],
        textureConfig: {},
        loggingFactory: loggingFactory,
        nameResolver: nameResolver,
        issueInspector: issueInspector,
        schemaValidator: schemaValidator
      });
      var mockedBean = {
        method1: sinon.stub(),
        method2: sinon.stub()
      }
      var MockedConstructor = function() {
        this.method1 = mockedBean.method1
        this.method2 = mockedBean.method2
      }
      var WrappedConstructor = objectDecorator.wrapPluginGadget(MockedConstructor, {
        pluginName: 'simple-plugin',
        gadgetType: 'services',
        gadgetName: 'originalBean'
      });
      var wrappedBean = new WrappedConstructor();
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

      //verify tracer
      let logState_method1 = tracerStore.add.filter(item => {
        return ('requestId' in item && item.methodName === 'method1');
      });
      assert.equal(logState_method1.length, 0);
      let logState_method2 = tracerStore.add.filter(item => {
        return ('requestId' in item && item.methodName === 'method2');
      });
      assert.equal(logState_method2.length, 0);
    });

    it('should wrap deep located methods of a plugin-gadget', function() {
      var methodTexture = {
        methodType: 'general', // promise, callback, general
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
      var textureConfig = {
        plugins: {
          "simplePlugin": {
            services: {
              originalBean: {
                level1: { method1: methodTexture },
                level2: { sub2: { method2: methodTexture } }
              }
            }
          }
        }
      }
      var objectDecorator = lab.initBackboneService('object-decorator', {
        textureNames: ['default'],
        textureConfig: textureConfig,
        loggingFactory: loggingFactory,
        nameResolver: nameResolver,
        issueInspector: issueInspector,
        schemaValidator: schemaValidator
      });
      var mockedBean = {
        level1: { method1: sinon.stub() },
        level2: { sub2: { method2: sinon.stub() } }
      }
      var MockedConstructor = function() {
        this.level1 = mockedBean.level1
        this.level2 = mockedBean.level2
      }
      var WrappedConstructor = objectDecorator.wrapPluginGadget(MockedConstructor, {
        pluginName: 'simple-plugin',
        gadgetType: 'services',
        gadgetName: 'originalBean'
      });
      var wrappedBean = new WrappedConstructor();
      // invokes method1() 3 times
      lodash.range(3).forEach(function() {
        wrappedBean.level1.method1('Hello world', {
          reqId: LogConfig.getLogID()
         });
      });
      assert.equal(mockedBean.level1.method1.callCount, 3);
      // invokes method2() 5 times
      lodash.range(5).forEach(function() {
        wrappedBean.level2.sub2.method2('Hello world', {
          reqId: LogConfig.getLogID()
        });
      });
      assert.equal(mockedBean.level2.sub2.method2.callCount, 5);
      //verify tracer
      let logState_method1 = tracerStore.add.filter(item => {
        return ('requestId' in item && item.methodName === 'method1');
      });
      assert.equal(logState_method1.length, 3 * 2);
      let logState_method2 = tracerStore.add.filter(item => {
        return ('requestId' in item && item.methodName === 'method2');
      });
      assert.equal(logState_method2.length, 5 * 2);
    });
  });

  describe('LoggingInterceptor', function() {
    var ObjectDecorator = rewire(lab.getDevebotModule('backbone/object-decorator'));
    var LoggingInterceptor = ObjectDecorator.__get__('LoggingInterceptor');

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

    function _test_LoggingInterceptor(params) {
      if (!lodash.isArray(params.scenarios)) {
        params.scenarios = [params.scenarios];
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

      var object = {
        sampleMethod: sinon.stub().callsFake(function(data, opts) {
          opts = opts || {};
          let scenario = params.scenarios[opts.index];
          let methodType = scenario.methodType || params.methodType;
          if (methodType === 'promise') {
            if (scenario.output.error) {
              return Promise.reject(scenario.output.error);
            }
            return Promise.resolve(scenario.output.value);
          }
          if (methodType === 'callback') {
            let cb = arguments[arguments.length - 1];
            return cb(scenario.output.error, scenario.output.value);
          }
          if (scenario.output.error) {
            throw scenario.output.error;
          }
          return scenario.output.value;
        })
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

      var loggingProxy = new LoggingInterceptor({
        object: object,
        objectName: params.methodType + 'Mode',
        method: object.sampleMethod,
        methodName: 'sampleMethod',
        texture: texture,
        logger: logger,
        tracer: tracer,
        preciseThreshold: params.preciseThreshold
      });

      var state = {
        methodType: undefined,
        counter: { promise: 0, callback: 0, general: 0 },
        pointer: { current: null, actionFlow: params.methodMode,
            preciseThreshold: params.preciseThreshold || 5 }
      }

      let p = Promise.each(params.scenarios, function(scenario, index) {
        let methodType = scenario.methodType || params.methodType;

        if (params.methodMode === 'explicit') {
          state.methodType = methodType;
        }
        if (params.methodMode === 'implicit') {
          if (state.pointer.current !== methodType) {
            for(var k in state.counter) {
              state.counter[k] = 0;
            }
            state.pointer.current = methodType;
          }
          state.counter[state.pointer.current]++;
        }

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

        if (methodType === 'callback') {
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
            var result = loggingProxy.capsule.apply(null, parameters);
            assert.isUndefined(result);
          });
        }
        if (methodType === 'promise') {
          var result = loggingProxy.capsule.apply(null, parameters);
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
        if (methodType === 'general') {
          var result = undefined, exception = undefined;
          try {
            result = loggingProxy.capsule.apply(null, parameters);
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
        assert.deepInclude(loggingProxy.__state__, state);
      })

      return p;
    }

    it('invokes the wrapped method in [promise] mode if the method returns a promise (success)', function() {
      return _test_LoggingInterceptor({
        methodMode: 'implicit',
        methodType: 'promise',
        scenarios: {
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
        }
      });
    });

    it('invokes the wrapped method in [promise] mode if the method returns a promise (failure)', function() {
      return _test_LoggingInterceptor({
        methodMode: 'implicit',
        methodType: 'promise',
        scenarios: {
          requestId: 'YkMjPoSoSyOTrLyf76Mzqg',
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
        }
      });
    });

    it('invokes the wrapped method in [callback] mode if parameter includes a callback (success)', function() {
      return _test_LoggingInterceptor({
        methodMode: 'implicit',
        methodType: 'callback',
        scenarios: {
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
        }
      });
    });

    it('invokes the wrapped method in [callback] mode if parameter includes a callback (failure)', function() {
      return _test_LoggingInterceptor({
        methodMode: 'implicit',
        methodType: 'callback',
        scenarios: {
          requestId: 'YkMjPoSoSyOTrLyf76Mzqg',
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
        }
      });
    });

    it('invokes the wrapped method in [general] mode if the method returns a normal result (success)', function() {
      return _test_LoggingInterceptor({
        methodMode: 'implicit',
        methodType: 'general',
        scenarios: {
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
        }
      });
    });

    it('invokes the wrapped method in [general] mode if the method returns a normal result (failure)', function() {
      return _test_LoggingInterceptor({
        methodMode: 'implicit',
        methodType: 'general',
        scenarios: {
          requestId: 'YkMjPoSoSyOTrLyf76Mzqg',
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
        }
      });
    });

    it('explicitly specified methodType (promise) will skip _detect() and call _invoke() in promise mode', function() {
      return _test_LoggingInterceptor({
        methodMode: 'explicit',
        methodType: 'promise',
        scenarios: {
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
        }
      });
    });

    it('explicitly specified methodType (promise) will skip _detect() and call _invoke() in promise mode (error)', function() {
      return _test_LoggingInterceptor({
        methodMode: 'explicit',
        methodType: 'promise',
        scenarios: {
          requestId: 'YkMjPoSoSyOTrLyf76Mzqg',
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
        }
      });
    });

    it('explicitly specified methodType (callback) will skip _detect() and call _invoke() in callback mode', function() {
      return _test_LoggingInterceptor({
        methodMode: 'explicit',
        methodType: 'callback',
        scenarios: {
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
        }
      });
    });

    it('explicitly specified methodType (callback) will skip _detect() and call _invoke() in callback mode (error)', function() {
      return _test_LoggingInterceptor({
        methodMode: 'explicit',
        methodType: 'callback',
        scenarios: {
          requestId: 'YkMjPoSoSyOTrLyf76Mzqg',
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
        }
      });
    });

    it('explicitly specified methodType (general) will skip _detect() and call _invoke() in general mode', function() {
      return _test_LoggingInterceptor({
        methodMode: 'explicit',
        methodType: 'general',
        scenarios: {
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
        }
      });
    });

    it('explicitly specified methodType (general) will skip _detect() and call _invoke() in general mode (error)', function() {
      return _test_LoggingInterceptor({
        methodMode: 'explicit',
        methodType: 'general',
        scenarios: {
          requestId: 'YkMjPoSoSyOTrLyf76Mzqg',
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
        }
      });
    });

    it('auto-detecting methodType (promise) will be stable after reliable number of continual steps', function() {
      return _test_LoggingInterceptor({
        methodMode: 'implicit',
        methodType: 'promise',
        preciseThreshold: 2,
        scenarios: [{
          requestId: 'YkMjPoSoSyOTrLyf76Mzqg',
          input: ['Message #1'],
          output: {
            error: null,
            value: { msg: "This is a normal result" }
          },
          tracer: {
            toMessage: {
              firstCallArgs: {
                info: 'Message #1'
              },
              secondCallArgs: {
                info: { msg: "This is a normal result" }
              }
            }
          }
        }, {
          requestId: 'YkMjPoSoSyOTrLyf76Mzqh',
          input: ['Message #2'],
          output: {
            error: new Error('The action has been failed'),
            value: { msg: "Anything" }
          },
          tracer: {
            toMessage: {
              firstCallArgs: {
                info: 'Message #2'
              },
              secondCallArgs: {
                info: {
                  "error_code": undefined,
                  "error_message": "The action has been failed"
                }
              }
            }
          }
        }, {
          requestId: 'YkMjPoSoSyOTrLyf76Mzqt',
          input: ['Message #3'],
          output: {
            error: new Error('The action has been failed'),
            value: { msg: "Anything" }
          },
          tracer: {
            add: {
              logState: {
                actionFlow: "explicit"
              }
            },
            toMessage: {
              firstCallArgs: {
                info: 'Message #3'
              },
              secondCallArgs: {
                info: {
                  "error_code": undefined,
                  "error_message": "The action has been failed"
                }
              }
            }
          }
        }],
        state: {
          methodType: 'promise',
          counter: {
            promise: 2
          },
          pointer: {
            actionFlow: 'explicit'
          }
        }
      });
    });

    it('auto-detecting methodType (callback) will be stable after reliable number of continual steps', function() {
      return _test_LoggingInterceptor({
        methodMode: 'implicit',
        methodType: 'callback',
        preciseThreshold: 2,
        scenarios: [{
          requestId: 'YkMjPoSoSyOTrLyf76Mzqg',
          input: ['Message #1'],
          output: {
            error: null,
            value: { msg: "This is a normal result" }
          },
          tracer: {
            toMessage: {
              firstCallArgs: {
                info: 'Message #1'
              },
              secondCallArgs: {
                info: { msg: "This is a normal result" }
              }
            }
          }
        }, {
          requestId: 'YkMjPoSoSyOTrLyf76Mzqh',
          input: ['Message #2'],
          output: {
            error: null,
            value: { msg: "This is a normal result" }
          },
          tracer: {
            toMessage: {
              firstCallArgs: {
                info: 'Message #2'
              },
              secondCallArgs: {
                info: { msg: "This is a normal result" }
              }
            }
          }
        }, {
          requestId: 'YkMjPoSoSyOTrLyf76Mzqt',
          input: ['Message #3'],
          output: {
            error: null,
            value: { msg: "This is a normal result" }
          },
          tracer: {
            add: {
              logState: {
                actionFlow: "explicit"
              }
            },
            toMessage: {
              firstCallArgs: {
                info: 'Message #3'
              },
              secondCallArgs: {
                info: { msg: "This is a normal result" }
              }
            }
          }
        }],
        state: {
          methodType: 'callback',
          counter: {
            callback: 2
          },
          pointer: {
            actionFlow: 'explicit'
          }
        }
      });
    });

    it('auto-detecting methodType (general) will be stable after reliable number of continual steps', function() {
      return _test_LoggingInterceptor({
        methodMode: 'implicit',
        methodType: 'general',
        preciseThreshold: 2,
        scenarios: [{
          requestId: 'YkMjPoSoSyOTrLyf76Mzqg',
          input: ['Message #1'],
          output: {
            error: null,
            value: { msg: "This is a normal result" }
          },
          tracer: {
            toMessage: {
              firstCallArgs: {
                info: 'Message #1'
              },
              secondCallArgs: {
                info: { msg: "This is a normal result" }
              }
            }
          }
        }, {
          requestId: 'YkMjPoSoSyOTrLyf76Mzqh',
          input: ['Message #2'],
          output: {
            error: new Error('The action has been failed'),
            value: { msg: "Anything" }
          },
          tracer: {
            toMessage: {
              firstCallArgs: {
                info: 'Message #2'
              },
              secondCallArgs: {
                info: {
                  "error_code": undefined,
                  "error_message": "The action has been failed"
                }
              }
            }
          }
        }, {
          requestId: 'YkMjPoSoSyOTrLyf76Mzqt',
          input: ['Message #3'],
          output: {
            error: new Error('The action has been failed'),
            value: { msg: "Anything" }
          },
          tracer: {
            add: {
              logState: {
                actionFlow: "explicit"
              }
            },
            toMessage: {
              firstCallArgs: {
                info: 'Message #3'
              },
              secondCallArgs: {
                info: {
                  "error_code": undefined,
                  "error_message": "The action has been failed"
                }
              }
            }
          }
        }],
        state: {
          methodType: 'general',
          counter: {
            general: 2
          },
          pointer: {
            actionFlow: 'explicit'
          }
        }
      });
    });

    it('methodType will be detected continuely if method is called with unstable ways', function() {
      return _test_LoggingInterceptor({
        methodMode: 'implicit',
        preciseThreshold: 3,
        scenarios: [{
          methodType: 'promise',
          requestId: 'YkMjPoSoSyOTrLyf76Mzqg',
          input: ['Message #1'],
          output: {
            error: null,
            value: { msg: "This is a normal result" }
          },
          tracer: {
            toMessage: {
              firstCallArgs: {
                info: 'Message #1'
              },
              secondCallArgs: {
                info: { msg: "This is a normal result" }
              }
            }
          }
        }, {
          methodType: 'promise',
          requestId: 'YkMjPoSoSyOTrLyf76Mzqh',
          input: ['Message #2'],
          output: {
            error: new Error('The action has been failed'),
            value: { msg: "Anything" }
          },
          tracer: {
            toMessage: {
              firstCallArgs: {
                info: 'Message #2'
              },
              secondCallArgs: {
                info: {
                  "error_code": undefined,
                  "error_message": "The action has been failed"
                }
              }
            }
          }
        }, {
          methodType: 'callback',
          requestId: 'YkMjPoSoSyOTrLyf76Mzqf',
          input: ['Message #3'],
          output: {
            error: null,
            value: { msg: "This is a normal result" }
          },
          tracer: {
            toMessage: {
              firstCallArgs: {
                info: 'Message #3'
              },
              secondCallArgs: {
                info: { msg: "This is a normal result" }
              }
            }
          }
        }, {
          methodType: 'callback',
          requestId: 'YkMjPoSoSyOTrLyf76Mzqi',
          input: ['Message #4'],
          output: {
            error: new Error('The action has been failed'),
            value: { msg: "Anything" }
          },
          tracer: {
            toMessage: {
              firstCallArgs: {
                info: 'Message #4'
              },
              secondCallArgs: {
                info: {
                  "error_code": undefined,
                  "error_message": "The action has been failed"
                }
              }
            }
          }
        }, {
          methodType: 'promise',
          requestId: 'YkMjPoSoSyOTrLyf76Mzqj',
          input: ['Message #5'],
          output: {
            error: new Error('The action has been failed'),
            value: { msg: "Anything" }
          },
          tracer: {
            toMessage: {
              firstCallArgs: {
                info: 'Message #5'
              },
              secondCallArgs: {
                info: {
                  "error_code": undefined,
                  "error_message": "The action has been failed"
                }
              }
            }
          }
        }],
        state: {
          methodType: undefined,
          counter: {
            promise: 1
          },
          pointer: {
            actionFlow: 'implicit'
          }
        }
      });
    });
  });

  describe('MockingInterceptor', function() {
    var ObjectDecorator = rewire(lab.getDevebotModule('backbone/object-decorator'));
    var MockingInterceptor = ObjectDecorator.__get__('MockingInterceptor');

    it('mocking will be skipped if texture.enabled is false', function() {
      var texture = {
        enabled: false,
        mocking: {
          mappings: {
            "default": {
              selector: sinon.stub().returns(true),
              generate: sinon.stub().returns({})
            }
          }
        }
      };
      var method = sinon.stub();
      method.withArgs("Will be success").returns("Thank you");
      method.withArgs("Will be failure").throws(new Error("Failed anyway"));
      var mockingProxy = new MockingInterceptor({texture, method});
      var output = mockingProxy.capsule("Will be success", { requestId: 'YkMjPoSoSyOTrLyf76Mzqg'});
      assert.equal(output, "Thank you");
      assert.throw(function() {
        return mockingProxy.capsule("Will be failure", { requestId: 'YkMjPoSoSyOTrLyf76Mzqg'})
      }, "Failed anyway");
      assert.equal(method.callCount, 2);
      assert.isFalse(texture.mocking.mappings.default.selector.called);
      assert.isFalse(texture.mocking.mappings.default.generate.called);
    })

    it('mocking will be skipped if texture.mocking.enabled is false', function() {
      var texture = {
        mocking: {
          enabled: false,
          mappings: {
            "default": {
              selector: sinon.stub().returns(true),
              generate: sinon.stub().returns({})
            }
          }
        }
      };
      var method = sinon.stub();
      method.withArgs("Will be success").returns("Thank you");
      method.withArgs("Will be failure").throws(new Error("Failed anyway"));
      var mockingProxy = new MockingInterceptor({texture, method});
      var output = mockingProxy.capsule("Will be success", { requestId: 'YkMjPoSoSyOTrLyf76Mzqg'});
      assert.equal(output, "Thank you");
      assert.throw(function() {
        return mockingProxy.capsule("Will be failure", { requestId: 'YkMjPoSoSyOTrLyf76Mzqg'})
      }, "Failed anyway");
      assert.equal(method.callCount, 2);
      assert.isFalse(texture.mocking.mappings.default.selector.called);
      assert.isFalse(texture.mocking.mappings.default.generate.called);
    });

    it('mocking will be skipped if texture.mocking.mappings not found', function() {
      var texture = { mocking: { } };
      var method = sinon.stub();
      method.withArgs("Will be success").returns("Thank you");
      method.withArgs("Will be failure").throws(new Error("Failed anyway"));
      var mockingProxy = new MockingInterceptor({texture, method});
      var output = mockingProxy.capsule("Will be success");
      assert.equal(output, "Thank you");
      assert.throw(function() {
        return mockingProxy.capsule("Will be failure")
      }, "Failed anyway");
      assert.equal(method.callCount, 2);
    });

    it('mocking will be skipped if texture.mocking.mappings is empty', function() {
      var texture = { mocking: { mappings: {} } };
      var method = sinon.stub();
      method.withArgs("Will be success").returns("Thank you");
      method.withArgs("Will be failure").throws(new Error("Failed anyway"));
      var mockingProxy = new MockingInterceptor({texture, method});
      var output = mockingProxy.capsule("Will be success");
      assert.equal(output, "Thank you");
      assert.throw(function() {
        return mockingProxy.capsule("Will be failure")
      }, "Failed anyway");
      assert.equal(method.callCount, 2);
    });

    it('mocking return a Promise when texture.isPromise is truthy', function() {
      var generate = sinon.stub();
      generate.withArgs("Will be success").returns("Action completed");
      generate.withArgs("Will be failure").throws(new Error("Failed anyway"));
      var texture = {
        isPromise: true,
        mocking: {
          mappings: {
            "success": {
              selector: sinon.stub().onFirstCall().returns(true).onSecondCall().returns(false),
              generate: generate
            },
            "failure": {
              selector: sinon.stub().onFirstCall().returns(true),
              generate: generate
            }
          }
        }
      };
      var method = sinon.stub();
      var mockingProxy = new MockingInterceptor({texture, method});

      var p = Promise.resolve();

      p = p.then(function() {
        var output = mockingProxy.capsule("Will be success", { requestId: 'YkMjPoSoSyOTrLyf76Mzqg'});
        assert.isFunction(output.then);
        assert.isTrue(output.isFulfilled());
        return output.then(function(result) {
          assert.equal(result, "Action completed");
        });
      });

      p = p.then(function() {
        var output = mockingProxy.capsule("Will be failure", { requestId: 'YkMjPoSoSyOTrLyf76Mzqg'});
        assert.isFunction(output.then);
        assert.isTrue(output.isRejected());
        return output.catch(function(error) {
          assert.equal(error.message, "Failed anyway");
          assert.equal(method.callCount, 0);
          return Promise.resolve();
        });
      });

      return p;
    });

    it('mocking push result to callback if texture.isPromise is falsy and the last argument is a callback', function() {
      var generate = sinon.stub();
      generate.withArgs("Will be success").returns("Action completed");
      generate.withArgs("Will be failure").throws(new Error("Failed anyway"));
      var texture = {
        mocking: {
          mappings: {
            "success": {
              selector: sinon.stub().onFirstCall().returns(true).onSecondCall().returns(false),
              generate: generate
            },
            "failure": {
              selector: sinon.stub().returns(true),
              generate: generate
            }
          }
        }
      };
      var method = sinon.stub();
      var mockingProxy = new MockingInterceptor({texture, method});

      return Promise.all([
        new Promise(function(onResolved, onRejected) {
          mockingProxy.capsule("Will be success", { requestId: 'YkMjPoSoSyOTrLyf76Mzqg'}, function(err, result) {
            assert.isUndefined(err);
            assert.equal(result, "Action completed");
            onResolved();
          });
        }),
        new Promise(function(onResolved, onRejected) {
          mockingProxy.capsule("Will be failure", { requestId: 'YkMjPoSoSyOTrLyf76Mzqg'}, function(err, result) {
            assert.equal(err.message, "Failed anyway");
            onResolved();
          })
        })
      ]).then(function() {
        assert.equal(method.callCount, 0);
        assert.equal(generate.callCount, 2);
      })
    });

    it('mocking return a normal result if texture.isPromise is falsy and the last argument is NOT a callback', function() {
      var generate = sinon.stub();
      generate.withArgs("Will be success").returns("Action completed");
      generate.withArgs("Will be failure").throws(new Error("Failed anyway"));
      var texture = {
        mocking: {
          mappings: {
            "success": {
              selector: sinon.stub().onFirstCall().returns(true).onSecondCall().returns(false),
              generate: generate
            },
            "failure": {
              selector: sinon.stub().returns(true),
              generate: generate
            }
          }
        }
      };
      var method = sinon.stub();
      var mockingProxy = new MockingInterceptor({texture, method});

      var output = mockingProxy.capsule("Will be success", { requestId: 'YkMjPoSoSyOTrLyf76Mzqg'});
      assert.equal(output, "Action completed");

      assert.throw(function() {
        return mockingProxy.capsule("Will be failure", { requestId: 'YkMjPoSoSyOTrLyf76Mzqg'})
      }, "Failed anyway");

      assert.equal(method.callCount, 0);
      assert.equal(generate.callCount, 2);
    });
  });

  after(function() {
    LogTracer.clearInterceptors();
    envmask.reset();
  });
});
