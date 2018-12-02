'use strict';

var lab = require('../index');
var Devebot = lab.getDevebot();
var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');
var chores = Devebot.require('chores');
var debugx = Devebot.require('pinbug')('tdd:devebot:core:object-decorator');
var assert = require('chai').assert;
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
            getRequestId: function(args, context) {
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
            getRequestId: function(args, context) {
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
            getRequestId: function(args, context) {
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
    var DEFAULT_TEXTURE = ObjectDecorator.__get__('DEFAULT_TEXTURE');
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
      var ExampleConstructor = function () {}
      ExampleConstructor.prototype.calculate = function() {}
      ExampleConstructor.prototype.getConfig = function() {}
      var opts = { textureOfBean: {
        enabled: false,
        methods: {
          calculate: DEFAULT_TEXTURE,
          getConfig: DEFAULT_TEXTURE
        }
      } };
      var WrappedConstructor = wrapConstructor(refs, ExampleConstructor, opts);
      assert.equal(WrappedConstructor, ExampleConstructor);
    });

    it('should wrap a constructor that will be invoked as a constructor', function() {
      var refs = { L: {}, T: {} };
      var opts = { textureOfBean: {} };

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
      var opts = { textureOfBean: {} };

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
    var DEFAULT_TEXTURE = ObjectDecorator.__get__('DEFAULT_TEXTURE');
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
      // verify wrapped bean
      assert.notEqual(wrappedBean, mockedBean);
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
        methods: {
          method1: {
            methodType: 'general', // promise, callback, general
            logging: {
              enabled: true,
              onRequest: {
                enabled: true,
                getRequestId: function(args, context) {
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
            getRequestId: function(args, context) {
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
        methods: {
          level1: { method1: lodash.cloneDeep(methodTexture) },
          level2: { sub2: { method2: lodash.cloneDeep(methodTexture) } },
          level3: { sub3: { bean3: { method3: lodash.cloneDeep(methodTexture) } } }
        }
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

    it('should support decorated context for nested method calls', function() {
      var textureOfBean = {
        methods: {
        start: lodash.cloneDeep(DEFAULT_TEXTURE),
          level1: { method1: lodash.cloneDeep(DEFAULT_TEXTURE) },
          level2: { sub2: { method2: lodash.cloneDeep(DEFAULT_TEXTURE) } },
          level3: { sub3: { bean3: {
            invoice: lodash.cloneDeep(DEFAULT_TEXTURE),
            summarize: lodash.cloneDeep(DEFAULT_TEXTURE)
          } } }
        }
      }
      var mockedBean = {
        start: function(amount, opts) {
          return this.report(amount, opts);
        },
        report: function(amount, opts) {
          return this.heading + this.level3.sub3.bean3.invoice(amount, opts);
        },
        heading: "Report: ",
        level1: { method1: sinon.stub() },
        level2: { sub2: { method2: sinon.stub() } },
        level3: { sub3: { bean3: new (function() {
          this.rate = 1.1;
          this.invoice = function(amount) {
            return "Total: " + this.summarize(amount);
          }
          this.summarize = function (amount) {
            return amount * this.getRate();
          }
          this.getRate = function() {
            if (0 <= this.rate && this.rate <= 1) return this.rate;
            return 1;
          }
        })()}}
      }
      var wrappedBean = wrapObject(CTX, mockedBean, {
        textureOfBean: textureOfBean,
        objectName: 'originalBean'
      });
      // number of requests
      var requestCount = 5;
      // invokes start() "requestCount" times
      var msgs = lodash.range(requestCount).map(function(i) {
        return wrappedBean.start(100 + i);
      });
      assert.deepEqual(msgs, [
        "Report: Total: 100",
        "Report: Total: 101",
        "Report: Total: 102",
        "Report: Total: 103",
        "Report: Total: 104"
      ]);
      // verify wrapMethod()
      assert.equal(wrapMethod.callCount, 5); // start, report, invoice, summarize, getRate
      //verify tracer for invoice()
      let logState_invoice = tracerStore.add.filter(item => {
        return ('requestId' in item && item.methodName === 'invoice');
      });
      assert.equal(logState_invoice.length, requestCount * 2);
      //verify tracer for summarize()
      let logState_summarize = tracerStore.add.filter(item => {
        return ('requestId' in item && item.methodName === 'summarize');
      });
      assert.equal(logState_summarize.length, requestCount * 2);
      //verify tracer for getRate()
      let logState_getRate = tracerStore.add.filter(item => {
        return ('requestId' in item && item.methodName === 'getRate');
      });
      assert.equal(logState_getRate.length, 0);
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
        gadgetName: 'originalBean',
        useDefaultTexture: false,
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
            getRequestId: function(args, context) {
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
                methods: {
                  level1: { method1: methodTexture },
                  level2: { sub2: { method2: methodTexture } }
                }
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
        gadgetName: 'originalBean',
        useDefaultTexture: false,
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
    var DEFAULT_TEXTURE = ObjectDecorator.__get__('DEFAULT_TEXTURE');

    function _captureTracerState(tracer) {
      var tracerState = { add: { callArgs: [] }, toMessage: { callArgs: [] } };
      tracerState.add.callCount = tracer.add.callCount;
      for(var i=0; i<tracerState.add.callCount; i++) {
        tracerState.add.callArgs.push(lodash.cloneDeep(tracer.add.getCall(i).args));
      }
      tracerState.toMessage.callCount = tracer.toMessage.callCount;
      for(var i=0; i<tracerState.toMessage.callCount; i++) {
        tracerState.toMessage.callArgs.push(lodash.cloneDeep(tracer.toMessage.getCall(i).args));
      }
      tracer.add.resetHistory();
      tracer.toMessage.resetHistory();
      return tracerState;
    }

    function _cleanup_toMessage_Args(callArgs) {
      return lodash.filter(callArgs, function(args){
        return Array.isArray(args) && args.length > 0 && args[0] && args[0]['info'];
      })
    }

    function _run_LoggingInterceptor_capsule(params) {
      if (!lodash.isArray(params.scenarios)) {
        params.scenarios = [params.scenarios];
      }
      var texture = {
        logging: {
          onRequest: {
            getRequestId: function(args, context) {
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

      let p = Promise.mapSeries(params.scenarios, function(scenario, index) {
        var flowState = { index: index, scenario: scenario };
        let methodType = scenario.methodType || params.methodType;

        var parameters = lodash.concat(scenario.input, [{ reqId: scenario.requestId, index }]);

        if (methodType === 'promise') {
          var output = loggingProxy.capsule.apply(null, parameters);
          flowState.result = {};
          return output.then(function (value) {
            flowState.result.value = lodash.cloneDeep(value);
            return value;
          }, function(error) {
            flowState.result.error = error;
            return Promise.resolve();
          }).then(function() {
            flowState.tracer = _captureTracerState(tracer);
            return flowState;
          });
        }
        if (methodType === 'callback') {
          return new Promise(function(onResolved, onRejected) {
            flowState.result = {};
            parameters.push(function (error, value) {
              if (error) {
                flowState.result.error = error;
              } else {
                flowState.result.value = value;
              }
              flowState.tracer = _captureTracerState(tracer);
              onResolved(flowState);
            });
            var output = loggingProxy.capsule.apply(null, parameters);
            assert.isUndefined(output);
          });
        }
        if (methodType === 'general') {
          flowState.result = {};
          try {
            flowState.result.value = loggingProxy.capsule.apply(null, parameters);
          } catch (error) {
            flowState.result.error = error;
          }
          flowState.tracer = _captureTracerState(tracer);
          return flowState;
        }
      })

      p = p.then(function(flowStates) {
        return {
          flowStates: flowStates,
          proxyState: lodash.cloneDeep(lodash.pick(loggingProxy.__state__, [
            'methodType', 'counter', 'pointer'
          ]))
        }
      })

      return p;
    }

    it('invokes the wrapped method in [promise] mode if the method returns a promise (success)', function() {
      return _run_LoggingInterceptor_capsule({
        methodMode: 'implicit',
        methodType: 'promise',
        scenarios: {
          requestId: 'YkMjPoSoSyOTrLyf76Mzqg',
          input: ['Hello world'],
          output: {
            error: null,
            value: { msg: "This is a normal result" }
          }
        }
      }).then(function(r) {
        false && console.log(JSON.stringify(r, null, 2));
        var step = r.flowStates[0];

        // verify result
        assert.hasAllKeys(step.result, ['value']);
        assert.deepEqual(step.result.value, step.scenario.output.value);

        // verify tracer
        assert.equal(step.tracer.add.callCount, 2);
        assert.deepEqual(step.tracer.add.callArgs, lodash.fill(Array(2), [
          {
            "objectName": "promiseMode",
            "methodName": "sampleMethod",
            "requestId": "YkMjPoSoSyOTrLyf76Mzqg",
            "requestType": "link",
            "actionFlow": "implicit"
          }
        ]));
        assert.equal(step.tracer.toMessage.callCount, 2);
        assert.deepEqual(step.tracer.toMessage.callArgs, [
          [
            {
              "text": "#{objectName}.#{methodName} - Request[#{requestId}] is invoked",
              "info": "Hello world"
            }
          ], [
            {
              "text": "#{objectName}.#{methodName} - Request[#{requestId}] has finished",
              "info": {
                "msg": "This is a normal result"
              }
            }
          ]
        ]);
        // verify proxyState
        assert.deepEqual(r.proxyState, {
          "methodType": undefined,
          "counter": {
            "promise": 1,
            "callback": 0,
            "general": 0
          },
          "pointer": {
            "current": "promise",
            "actionFlow": "implicit",
            "preciseThreshold": 5
          }
        });
      });
    });

    it('invokes the wrapped method in [promise] mode if the method returns a promise (failure)', function() {
      return _run_LoggingInterceptor_capsule({
        methodMode: 'implicit',
        methodType: 'promise',
        scenarios: {
          requestId: 'YkMjPoSoSyOTrLyf76Mzqg',
          input: ['Hello world'],
          output: {
            error: new Error('The action has been failed'),
            value: { msg: "Anything" }
          }
        }
      }).then(function(r) {
        false && console.log(JSON.stringify(r, null, 2));
        var step = r.flowStates[0];

        // verify result
        assert.hasAllKeys(step.result, ['error']);
        assert.deepEqual(step.result.error, step.scenario.output.error);

        // verify tracer
        assert.equal(step.tracer.add.callCount, 2);
        assert.deepEqual(step.tracer.add.callArgs, lodash.fill(Array(2), [
          {
            "objectName": "promiseMode",
            "methodName": "sampleMethod",
            "requestId": "YkMjPoSoSyOTrLyf76Mzqg",
            "requestType": "link",
            "actionFlow": "implicit"
          }
        ]));
        assert.equal(step.tracer.toMessage.callCount, 2);
        assert.deepEqual(step.tracer.toMessage.callArgs, [
          [
            {
              "text": "#{objectName}.#{methodName} - Request[#{requestId}] is invoked",
              "info": "Hello world"
            }
          ], [
            {
              "text": "#{objectName}.#{methodName} - Request[#{requestId}] has failed",
              "info": {
                "error_code": undefined,
                "error_message": "The action has been failed"
              }
            }
          ]
        ]);
        // verify proxyState
        assert.deepEqual(r.proxyState, {
          "methodType": undefined,
          "counter": {
            "promise": 1,
            "callback": 0,
            "general": 0
          },
          "pointer": {
            "current": "promise",
            "actionFlow": "implicit",
            "preciseThreshold": 5
          }
        });
      });
    });

    it('invokes the wrapped method in [callback] mode if parameter includes a callback (success)', function() {
      return _run_LoggingInterceptor_capsule({
        methodMode: 'implicit',
        methodType: 'callback',
        scenarios: {
          requestId: 'YkMjPoSoSyOTrLyf76Mzqg',
          input: ['Hello world'],
          output: {
            error: null,
            value: { msg: "This is a normal result" }
          }
        }
      }).then(function(r) {
        false && console.log(JSON.stringify(r, null, 2));
        var step = r.flowStates[0];

        // verify result
        assert.hasAllKeys(step.result, ['value']);
        assert.deepEqual(step.result.value, step.scenario.output.value);

        // verify tracer
        assert.equal(step.tracer.add.callCount, 2);
        assert.deepEqual(step.tracer.add.callArgs, lodash.fill(Array(2), [
          {
            "objectName": "callbackMode",
            "methodName": "sampleMethod",
            "requestId": "YkMjPoSoSyOTrLyf76Mzqg",
            "requestType": "link",
            "actionFlow": "implicit"
          }
        ]));
        assert.equal(step.tracer.toMessage.callCount, 2);
        assert.deepEqual(step.tracer.toMessage.callArgs, [
          [
            {
              "text": "#{objectName}.#{methodName} - Request[#{requestId}] is invoked",
              "info": "Hello world"
            }
          ], [
            {
              "text": "#{objectName}.#{methodName} - Request[#{requestId}] has finished",
              "info": {
                "msg": "This is a normal result"
              }
            }
          ]
        ]);
        // verify proxyState
        assert.deepEqual(r.proxyState, {
          "methodType": undefined,
          "counter": {
            "promise": 0,
            "callback": 1,
            "general": 1
          },
          "pointer": {
            "current": "general",
            "actionFlow": "implicit",
            "preciseThreshold": 5
          }
        });
        return r;
      });
    });

    it('invokes the wrapped method in [callback] mode if parameter includes a callback (failure)', function() {
      return _run_LoggingInterceptor_capsule({
        methodMode: 'implicit',
        methodType: 'callback',
        scenarios: {
          requestId: 'YkMjPoSoSyOTrLyf76Mzqg',
          input: ['Hello world'],
          output: {
            error: new Error('The action has been failed'),
            value: { msg: "Anything" }
          }
        }
      }).then(function(r) {
        false && console.log(JSON.stringify(r, null, 2));
        var step = r.flowStates[0];

        // verify result
        assert.hasAllKeys(step.result, ['error']);
        assert.deepEqual(step.result.error, step.scenario.output.error);

        // verify tracer
        assert.equal(step.tracer.add.callCount, 2);
        assert.deepEqual(step.tracer.add.callArgs, lodash.fill(Array(2), [
          {
            "objectName": "callbackMode",
            "methodName": "sampleMethod",
            "requestId": "YkMjPoSoSyOTrLyf76Mzqg",
            "requestType": "link",
            "actionFlow": "implicit"
          }
        ]));
        assert.equal(step.tracer.toMessage.callCount, 2);
        assert.deepEqual(step.tracer.toMessage.callArgs, [
          [
            {
              "text": "#{objectName}.#{methodName} - Request[#{requestId}] is invoked",
              "info": "Hello world"
            }
          ], [
            {
              "text": "#{objectName}.#{methodName} - Request[#{requestId}] has failed",
              "info": {
                "error_code": undefined,
                "error_message": "The action has been failed"
              }
            }
          ]
        ]);
        // verify proxyState
        assert.deepEqual(r.proxyState, {
          "methodType": undefined,
          "counter": {
            "promise": 0,
            "callback": 1,
            "general": 1
          },
          "pointer": {
            "current": "general",
            "actionFlow": "implicit",
            "preciseThreshold": 5
          }
        });
        return r;
      });
    });

    it('invokes the wrapped method in [general] mode if the method returns a normal result (success)', function() {
      return _run_LoggingInterceptor_capsule({
        methodMode: 'implicit',
        methodType: 'general',
        scenarios: {
          requestId: 'YkMjPoSoSyOTrLyf76Mzqg',
          input: ['Hello world'],
          output: {
            error: null,
            value: { msg: "This is a normal result" }
          }
        }
      }).then(function(r) {
        false && console.log(JSON.stringify(r, null, 2));
        var step = r.flowStates[0];

        // verify result
        assert.hasAllKeys(step.result, ['value']);
        assert.deepEqual(step.result.value, step.scenario.output.value);

        // verify tracer
        assert.equal(step.tracer.add.callCount, 2);
        assert.deepEqual(step.tracer.add.callArgs, lodash.fill(Array(2), [
          {
            "objectName": "generalMode",
            "methodName": "sampleMethod",
            "requestId": "YkMjPoSoSyOTrLyf76Mzqg",
            "requestType": "link",
            "actionFlow": "implicit"
          }
        ]));
        assert.equal(step.tracer.toMessage.callCount, 2);
        assert.deepEqual(step.tracer.toMessage.callArgs, [
          [
            {
              "text": "#{objectName}.#{methodName} - Request[#{requestId}] is invoked",
              "info": "Hello world"
            }
          ], [
            {
              "text": "#{objectName}.#{methodName} - Request[#{requestId}] has finished",
              "info": {
                "msg": "This is a normal result"
              }
            }
          ]
        ]);
        // verify proxyState
        assert.deepEqual(r.proxyState, {
          "methodType": undefined,
          "counter": {
            "promise": 0,
            "callback": 0,
            "general": 1
          },
          "pointer": {
            "current": "general",
            "actionFlow": "implicit",
            "preciseThreshold": 5
          }
        });
      });
    });

    it('invokes the wrapped method in [general] mode if the method returns a normal result (failure)', function() {
      return _run_LoggingInterceptor_capsule({
        methodMode: 'implicit',
        methodType: 'general',
        scenarios: {
          requestId: 'YkMjPoSoSyOTrLyf76Mzqg',
          input: ['Hello world'],
          output: {
            error: new Error('The action has been failed'),
            value: { msg: "Anything" }
          }
        }
      }).then(function(r) {
        false && console.log(JSON.stringify(r, null, 2));
        var step = r.flowStates[0];

        // verify result
        assert.hasAllKeys(step.result, ['error']);
        assert.deepEqual(step.result.error, step.scenario.output.error);

        // verify tracer
        assert.equal(step.tracer.add.callCount, 2);
        assert.deepEqual(step.tracer.add.callArgs, lodash.fill(Array(2), [
          {
            "objectName": "generalMode",
            "methodName": "sampleMethod",
            "requestId": "YkMjPoSoSyOTrLyf76Mzqg",
            "requestType": "link",
            "actionFlow": "implicit"
          }
        ]));
        assert.equal(step.tracer.toMessage.callCount, 2);
        assert.deepEqual(step.tracer.toMessage.callArgs, [
          [
            {
              "text": "#{objectName}.#{methodName} - Request[#{requestId}] is invoked",
              "info": "Hello world"
            }
          ], [
            {
              "text": "#{objectName}.#{methodName} - Request[#{requestId}] has failed",
              "info": {
                "error_code": undefined,
                "error_message": "The action has been failed"
              }
            }
          ]
        ]);
        // verify proxyState
        assert.deepEqual(r.proxyState, {
          "methodType": undefined,
          "counter": {
            "promise": 0,
            "callback": 0,
            "general": 1
          },
          "pointer": {
            "current": "general",
            "actionFlow": "implicit",
            "preciseThreshold": 5
          }
        });
      });
    });

    it('explicitly specified methodType (promise) will skip _detect() and call _invoke() in promise mode', function() {
      return _run_LoggingInterceptor_capsule({
        methodMode: 'explicit',
        methodType: 'promise',
        scenarios: {
          requestId: 'YkMjPoSoSyOTrLyf76Mzqg',
          input: ['Hello world'],
          output: {
            error: null,
            value: { msg: "This is a normal result" }
          }
        }
      }).then(function(r) {
        false && console.log(JSON.stringify(r, null, 2));
        var step = r.flowStates[0];

        // verify result
        assert.hasAllKeys(step.result, ['value']);
        assert.deepEqual(step.result.value, step.scenario.output.value);

        // verify tracer
        assert.equal(step.tracer.add.callCount, 2);
        assert.deepEqual(step.tracer.add.callArgs, lodash.fill(Array(2), [
          {
            "objectName": "promiseMode",
            "methodName": "sampleMethod",
            "requestId": "YkMjPoSoSyOTrLyf76Mzqg",
            "requestType": "link",
            "actionFlow": "explicit"
          }
        ]));
        assert.equal(step.tracer.toMessage.callCount, 2);
        assert.deepEqual(step.tracer.toMessage.callArgs, [
          [
            {
              "text": "#{objectName}.#{methodName} - Request[#{requestId}] is invoked",
              "info": "Hello world"
            }
          ], [
            {
              "text": "#{objectName}.#{methodName} - Request[#{requestId}] has finished",
              "info": {
                "msg": "This is a normal result"
              }
            }
          ]
        ]);
        // verify proxyState
        assert.deepEqual(r.proxyState, {
          "methodType": "promise",
          "counter": {
            "promise": 0,
            "callback": 0,
            "general": 0
          },
          "pointer": {
            "current": null,
            "actionFlow": "explicit",
            "preciseThreshold": 5
          }
        });
      });
    });

    it('explicitly specified methodType (promise) will skip _detect() and call _invoke() in promise mode (error)', function() {
      return _run_LoggingInterceptor_capsule({
        methodMode: 'explicit',
        methodType: 'promise',
        scenarios: {
          requestId: 'YkMjPoSoSyOTrLyf76Mzqg',
          input: ['Hello world'],
          output: {
            error: new Error('The action has been failed'),
            value: { msg: "Anything" }
          }
        }
      }).then(function(r) {
        false && console.log(JSON.stringify(r, null, 2));
        var step = r.flowStates[0];

        // verify result
        assert.hasAllKeys(step.result, ['error']);
        assert.deepEqual(step.result.error, step.scenario.output.error);

        // verify tracer
        assert.equal(step.tracer.add.callCount, 2);
        assert.deepEqual(step.tracer.add.callArgs, lodash.fill(Array(2), [
          {
            "objectName": "promiseMode",
            "methodName": "sampleMethod",
            "requestId": "YkMjPoSoSyOTrLyf76Mzqg",
            "requestType": "link",
            "actionFlow": "explicit"
          }
        ]));
        assert.equal(step.tracer.toMessage.callCount, 2);
        assert.deepEqual(step.tracer.toMessage.callArgs, [
          [
            {
              "text": "#{objectName}.#{methodName} - Request[#{requestId}] is invoked",
              "info": "Hello world"
            }
          ], [
            {
              "text": "#{objectName}.#{methodName} - Request[#{requestId}] has failed",
              "info": {
                "error_code": undefined,
                "error_message": "The action has been failed"
              }
            }
          ]
        ]);
        // verify proxyState
        assert.deepEqual(r.proxyState, {
          "methodType": "promise",
          "counter": {
            "promise": 0,
            "callback": 0,
            "general": 0
          },
          "pointer": {
            "current": null,
            "actionFlow": "explicit",
            "preciseThreshold": 5
          }
        });
      });
    });

    it('explicitly specified methodType (callback) will skip _detect() and call _invoke() in callback mode', function() {
      return _run_LoggingInterceptor_capsule({
        methodMode: 'explicit',
        methodType: 'callback',
        scenarios: {
          requestId: 'YkMjPoSoSyOTrLyf76Mzqg',
          input: ['Hello world'],
          output: {
            error: null,
            value: { msg: "This is a normal result" }
          }
        }
      }).then(function(r) {
        false && console.log(JSON.stringify(r, null, 2));
        var step = r.flowStates[0];

        // verify result
        assert.hasAllKeys(step.result, ['value']);
        assert.deepEqual(step.result.value, step.scenario.output.value);

        // verify tracer
        assert.equal(step.tracer.add.callCount, 2);
        assert.deepEqual(step.tracer.add.callArgs, lodash.fill(Array(2), [
          {
            "objectName": "callbackMode",
            "methodName": "sampleMethod",
            "requestId": "YkMjPoSoSyOTrLyf76Mzqg",
            "requestType": "link",
            "actionFlow": "explicit"
          }
        ]));
        assert.equal(step.tracer.toMessage.callCount, 2);
        assert.deepEqual(step.tracer.toMessage.callArgs, [
          [
            {
              "text": "#{objectName}.#{methodName} - Request[#{requestId}] is invoked",
              "info": "Hello world"
            }
          ], [
            {
              "text": "#{objectName}.#{methodName} - Request[#{requestId}] has finished",
              "info": {
                "msg": "This is a normal result"
              }
            }
          ]
        ]);
        // verify proxyState
        assert.deepEqual(r.proxyState, {
          "methodType": "callback",
          "counter": {
            "promise": 0,
            "callback": 0,
            "general": 0
          },
          "pointer": {
            "current": null,
            "actionFlow": "explicit",
            "preciseThreshold": 5
          }
        });
        return r;
      });
    });

    it('explicitly specified methodType (callback) will skip _detect() and call _invoke() in callback mode (error)', function() {
      return _run_LoggingInterceptor_capsule({
        methodMode: 'explicit',
        methodType: 'callback',
        scenarios: {
          requestId: 'YkMjPoSoSyOTrLyf76Mzqg',
          input: ['Hello world'],
          output: {
            error: new Error('The action has been failed'),
            value: { msg: "Anything" }
          }
        }
      }).then(function(r) {
        false && console.log(JSON.stringify(r, null, 2));
        var step = r.flowStates[0];

        // verify result
        assert.hasAllKeys(step.result, ['error']);
        assert.deepEqual(step.result.error, step.scenario.output.error);

        // verify tracer
        assert.equal(step.tracer.add.callCount, 2);
        assert.deepEqual(step.tracer.add.callArgs, lodash.fill(Array(2), [
          {
            "objectName": "callbackMode",
            "methodName": "sampleMethod",
            "requestId": "YkMjPoSoSyOTrLyf76Mzqg",
            "requestType": "link",
            "actionFlow": "explicit"
          }
        ]));
        assert.equal(step.tracer.toMessage.callCount, 2);
        assert.deepEqual(step.tracer.toMessage.callArgs, [
          [
            {
              "text": "#{objectName}.#{methodName} - Request[#{requestId}] is invoked",
              "info": "Hello world"
            }
          ], [
            {
              "text": "#{objectName}.#{methodName} - Request[#{requestId}] has failed",
              "info": {
                "error_code": undefined,
                "error_message": "The action has been failed"
              }
            }
          ]
        ]);
        // verify proxyState
        assert.deepEqual(r.proxyState, {
          "methodType": "callback",
          "counter": {
            "promise": 0,
            "callback": 0,
            "general": 0
          },
          "pointer": {
            "current": null,
            "actionFlow": "explicit",
            "preciseThreshold": 5
          }
        });
        return r;
      });
    });

    it('explicitly specified methodType (general) will skip _detect() and call _invoke() in general mode', function() {
      return _run_LoggingInterceptor_capsule({
        methodMode: 'explicit',
        methodType: 'general',
        scenarios: {
          requestId: 'YkMjPoSoSyOTrLyf76Mzqg',
          input: ['Hello world'],
          output: {
            error: null,
            value: { msg: "This is a normal result" }
          }
        }
      }).then(function(r) {
        false && console.log(JSON.stringify(r, null, 2));
        var step = r.flowStates[0];

        // verify result
        assert.hasAllKeys(step.result, ['value']);
        assert.deepEqual(step.result.value, step.scenario.output.value);

        // verify tracer
        assert.equal(step.tracer.add.callCount, 2);
        assert.deepEqual(step.tracer.add.callArgs, lodash.fill(Array(2), [
          {
            "objectName": "generalMode",
            "methodName": "sampleMethod",
            "requestId": "YkMjPoSoSyOTrLyf76Mzqg",
            "requestType": "link",
            "actionFlow": "explicit"
          }
        ]));
        assert.equal(step.tracer.toMessage.callCount, 2);
        assert.deepEqual(step.tracer.toMessage.callArgs, [
          [
            {
              "text": "#{objectName}.#{methodName} - Request[#{requestId}] is invoked",
              "info": "Hello world"
            }
          ], [
            {
              "text": "#{objectName}.#{methodName} - Request[#{requestId}] has finished",
              "info": {
                "msg": "This is a normal result"
              }
            }
          ]
        ]);
        // verify proxyState
        assert.deepEqual(r.proxyState, {
          "methodType": "general",
          "counter": {
            "promise": 0,
            "callback": 0,
            "general": 0
          },
          "pointer": {
            "current": null,
            "actionFlow": "explicit",
            "preciseThreshold": 5
          }
        });
      });
    });

    it('explicitly specified methodType (general) will skip _detect() and call _invoke() in general mode (error)', function() {
      return _run_LoggingInterceptor_capsule({
        methodMode: 'explicit',
        methodType: 'general',
        scenarios: {
          requestId: 'YkMjPoSoSyOTrLyf76Mzqg',
          input: ['Hello world'],
          output: {
            error: new Error('The action has been failed'),
            value: { msg: "Anything" }
          }
        }
      }).then(function(r) {
        false && console.log(JSON.stringify(r, null, 2));
        var step = r.flowStates[0];

        // verify result
        assert.hasAllKeys(step.result, ['error']);
        assert.deepEqual(step.result.error, step.scenario.output.error);

        // verify tracer
        assert.equal(step.tracer.add.callCount, 2);
        assert.deepEqual(step.tracer.add.callArgs, lodash.fill(Array(2), [
          {
            "objectName": "generalMode",
            "methodName": "sampleMethod",
            "requestId": "YkMjPoSoSyOTrLyf76Mzqg",
            "requestType": "link",
            "actionFlow": "explicit"
          }
        ]));
        assert.equal(step.tracer.toMessage.callCount, 2);
        assert.deepEqual(step.tracer.toMessage.callArgs, [
          [
            {
              "text": "#{objectName}.#{methodName} - Request[#{requestId}] is invoked",
              "info": "Hello world"
            }
          ], [
            {
              "text": "#{objectName}.#{methodName} - Request[#{requestId}] has failed",
              "info": {
                "error_code": undefined,
                "error_message": "The action has been failed"
              }
            }
          ]
        ]);
        // verify proxyState
        assert.deepEqual(r.proxyState, {
          "methodType": "general",
          "counter": {
            "promise": 0,
            "callback": 0,
            "general": 0
          },
          "pointer": {
            "current": null,
            "actionFlow": "explicit",
            "preciseThreshold": 5
          }
        });
      });
    });

    it('auto-detecting methodType (promise) will be stable after reliable number of continual steps', function() {
      return _run_LoggingInterceptor_capsule({
        methodMode: 'implicit',
        methodType: 'promise',
        preciseThreshold: 2,
        scenarios: [{
          requestId: 'YkMjPoSoSyOTrLyf76Mzqg',
          input: ['Message #1'],
          output: {
            error: null,
            value: { msg: "This is a normal result" }
          }
        }, {
          requestId: 'YkMjPoSoSyOTrLyf76Mzqh',
          input: ['Message #2'],
          output: {
            error: new Error('The action has been failed'),
            value: { msg: "Anything" }
          }
        }, {
          requestId: 'YkMjPoSoSyOTrLyf76Mzqt',
          input: ['Message #3'],
          output: {
            error: new Error('The action has been failed'),
            value: { msg: "Anything" }
          }
        }]
      }).then(function(r) {
        false && console.log(JSON.stringify(r, null, 2));
        r.flowStates.forEach(function(step, i, total) {
          // verify result
          if (step.scenario.output.error == null) {
            assert.hasAllKeys(step.result, ['value']);
            assert.deepEqual(step.result.value, step.scenario.output.value);
          } else {
            assert.hasAllKeys(step.result, ['error']);
            assert.deepEqual(step.result.error, step.scenario.output.error);
          }

          // verify tracer
          var actionFlow = 'implicit';
          if (i >= 2) { // preciseThreshold
            actionFlow = 'explicit';
          }
          assert.equal(step.tracer.add.callCount, 2);
          assert.deepEqual(step.tracer.add.callArgs, lodash.fill(Array(step.tracer.add.callCount), [
            {
              "objectName": "promiseMode",
              "methodName": "sampleMethod",
              "requestId": step.scenario.requestId,
              "requestType": "link",
              "actionFlow": actionFlow
            }
          ]));
          assert.equal(step.tracer.toMessage.callCount, step.tracer.add.callCount);
          if (step.scenario.output.error == null) {
            assert.deepEqual(step.tracer.toMessage.callArgs, [
              [
                {
                  "text": "#{objectName}.#{methodName} - Request[#{requestId}] is invoked",
                  "info": step.scenario.input[0]
                }
              ], [
                {
                  "text": "#{objectName}.#{methodName} - Request[#{requestId}] has finished",
                  "info": {
                    "msg": "This is a normal result"
                  }
                }
              ]
            ]);
          } else {
            assert.deepEqual(step.tracer.toMessage.callArgs, [
              [
                {
                  "text": "#{objectName}.#{methodName} - Request[#{requestId}] is invoked",
                  "info": step.scenario.input[0]
                }
              ], [
                {
                  "text": "#{objectName}.#{methodName} - Request[#{requestId}] has failed",
                  "info": {
                    "error_code": undefined,
                    "error_message": "The action has been failed"
                  }
                }
              ]
            ]);
          }
        })
        // verify proxyState
        assert.deepEqual(r.proxyState, {
          "methodType": "promise",
          "counter": {
            "promise": 2,
            "callback": 0,
            "general": 0
          },
          "pointer": {
            "current": "promise",
            "actionFlow": "explicit",
            "preciseThreshold": 2
          }
        });
        return r;
      });
    });

    it('auto-detecting methodType (callback) will be stable after reliable number of continual steps', function() {
      return _run_LoggingInterceptor_capsule({
        methodMode: 'implicit',
        methodType: 'callback',
        preciseThreshold: 2,
        scenarios: [{
          requestId: 'YkMjPoSoSyOTrLyf76Mzqg',
          input: ['Message #1'],
          output: {
            error: null,
            value: { msg: "This is a normal result" }
          }
        }, {
          requestId: 'YkMjPoSoSyOTrLyf76Mzqh',
          input: ['Message #2'],
          output: {
            error: null,
            value: { msg: "This is a normal result" }
          }
        }, {
          requestId: 'YkMjPoSoSyOTrLyf76Mzqi',
          input: ['Message #3'],
          output: {
            error: null,
            value: { msg: "This is a normal result" }
          }
        }, {
          requestId: 'YkMjPoSoSyOTrLyf76Mzqj',
          input: ['Message #4'],
          output: {
            error: null,
            value: { msg: "This is a normal result" }
          }
        }]
      }).then(function(r) {
        false && console.log(JSON.stringify(r, null, 2));
        r.flowStates.forEach(function(step, i, total) {
          // verify result
          if (step.scenario.output.error == null) {
            assert.hasAllKeys(step.result, ['value']);
            assert.deepEqual(step.result.value, step.scenario.output.value);
          }

          // verify tracer
          var actionFlow = 'implicit';
          if (i >= 2) { // preciseThreshold
            actionFlow = 'explicit';
          }
          assert.isTrue(2 <= step.tracer.add.callCount);
          assert.isTrue(step.tracer.add.callCount <= 3);
          assert.deepEqual(step.tracer.add.callArgs, lodash.fill(Array(step.tracer.add.callCount), [
            {
              "objectName": "callbackMode",
              "methodName": "sampleMethod",
              "requestId": step.scenario.requestId,
              "requestType": "link",
              "actionFlow": actionFlow
            }
          ]));
          assert.equal(step.tracer.toMessage.callCount, step.tracer.add.callCount);
          assert.deepEqual(_cleanup_toMessage_Args(step.tracer.toMessage.callArgs), [
            [
              {
                "text": "#{objectName}.#{methodName} - Request[#{requestId}] is invoked",
                "info": step.scenario.input[0]
              }
            ], [
              {
                "text": "#{objectName}.#{methodName} - Request[#{requestId}] has finished",
                "info": {
                  "msg": "This is a normal result"
                }
              }
            ]
          ]);
        })
        // verify proxyState
        assert.deepEqual(r.proxyState, {
          "methodType": "callback",
          "counter": {
            "promise": 0,
            "callback": 2,
            "general": 2
          },
          "pointer": {
            "current": "general",
            "actionFlow": "explicit",
            "preciseThreshold": 2
          }
        });
        return r;
      });
    });

    it('auto-detecting methodType (general) will be stable after reliable number of continual steps', function() {
      return _run_LoggingInterceptor_capsule({
        methodMode: 'implicit',
        methodType: 'general',
        preciseThreshold: 2,
        scenarios: [{
          requestId: 'YkMjPoSoSyOTrLyf76Mzqg',
          input: ['Message #1'],
          output: {
            error: null,
            value: { msg: "This is a normal result" }
          }
        }, {
          requestId: 'YkMjPoSoSyOTrLyf76Mzqh',
          input: ['Message #2'],
          output: {
            error: new Error('The action has been failed'),
            value: { msg: "Anything" }
          }
        }, {
          requestId: 'YkMjPoSoSyOTrLyf76Mzqt',
          input: ['Message #3'],
          output: {
            error: new Error('The action has been failed'),
            value: { msg: "Anything" }
          }
        }]
      }).then(function(r) {
        false && console.log(JSON.stringify(r, null, 2));
        r.flowStates.forEach(function(step, i, total) {
          // verify result
          if (step.scenario.output.error == null) {
            assert.hasAllKeys(step.result, ['value']);
            assert.deepEqual(step.result.value, step.scenario.output.value);
          } else {
            assert.hasAllKeys(step.result, ['error']);
            assert.deepEqual(step.result.error, step.scenario.output.error);
          }

          // verify tracer
          var actionFlow = 'implicit';
          if (i >= 2) { // preciseThreshold
            actionFlow = 'explicit';
          }
          assert.equal(step.tracer.add.callCount, 2);
          assert.deepEqual(step.tracer.add.callArgs, lodash.fill(Array(step.tracer.add.callCount), [
            {
              "objectName": "generalMode",
              "methodName": "sampleMethod",
              "requestId": step.scenario.requestId,
              "requestType": "link",
              "actionFlow": actionFlow
            }
          ]));
          assert.equal(step.tracer.toMessage.callCount, step.tracer.add.callCount);
          if (step.scenario.output.error == null) {
            assert.deepEqual(step.tracer.toMessage.callArgs, [
              [
                {
                  "text": "#{objectName}.#{methodName} - Request[#{requestId}] is invoked",
                  "info": step.scenario.input[0]
                }
              ], [
                {
                  "text": "#{objectName}.#{methodName} - Request[#{requestId}] has finished",
                  "info": {
                    "msg": "This is a normal result"
                  }
                }
              ]
            ]);
          } else {
            assert.deepEqual(step.tracer.toMessage.callArgs, [
              [
                {
                  "text": "#{objectName}.#{methodName} - Request[#{requestId}] is invoked",
                  "info": step.scenario.input[0]
                }
              ], [
                {
                  "text": "#{objectName}.#{methodName} - Request[#{requestId}] has failed",
                  "info": {
                    "error_code": undefined,
                    "error_message": "The action has been failed"
                  }
                }
              ]
            ]);
          }
        })
        // verify proxyState
        assert.deepEqual(r.proxyState, {
          "methodType": "general",
          "counter": {
            "promise": 0,
            "callback": 0,
            "general": 2
          },
          "pointer": {
            "current": "general",
            "actionFlow": "explicit",
            "preciseThreshold": 2
          }
        });
        return r;
      });
    });

    it('methodType will be detected continuely if method is called with unstable ways', function() {
      return _run_LoggingInterceptor_capsule({
        methodMode: 'implicit',
        preciseThreshold: 3,
        scenarios: [{
          methodType: 'promise',
          requestId: 'YkMjPoSoSyOTrLyf76Mzqg',
          input: ['Message #1'],
          output: {
            error: null,
            value: { msg: "This is a normal result" }
          }
        }, {
          methodType: 'promise',
          requestId: 'YkMjPoSoSyOTrLyf76Mzqh',
          input: ['Message #2'],
          output: {
            error: new Error('The action has been failed'),
            value: { msg: "Anything" }
          }
        }, {
          methodType: 'callback',
          requestId: 'YkMjPoSoSyOTrLyf76Mzqf',
          input: ['Message #3'],
          output: {
            error: null,
            value: { msg: "This is a normal result" }
          }
        }, {
          methodType: 'callback',
          requestId: 'YkMjPoSoSyOTrLyf76Mzqi',
          input: ['Message #4'],
          output: {
            error: new Error('The action has been failed'),
            value: { msg: "Anything" }
          }
        }, {
          methodType: 'promise',
          requestId: 'YkMjPoSoSyOTrLyf76Mzqj',
          input: ['Message #5'],
          output: {
            error: new Error('The action has been failed'),
            value: { msg: "Anything" }
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
      }).then(function(r) {
        false && console.log(JSON.stringify(r, null, 2));
        r.flowStates.forEach(function(step, i, total) {
          // verify result
          if (step.scenario.output.error == null) {
            assert.hasAllKeys(step.result, ['value']);
            assert.deepEqual(step.result.value, step.scenario.output.value);
          } else {
            assert.hasAllKeys(step.result, ['error']);
            assert.deepEqual(step.result.error, step.scenario.output.error);
          }

          // verify tracer
          assert.isTrue(2 <= step.tracer.add.callCount);
          assert.isTrue(step.tracer.add.callCount <= 3);
          assert.deepEqual(step.tracer.add.callArgs, lodash.fill(Array(step.tracer.add.callCount), [
            {
              "objectName": "undefinedMode",
              "methodName": "sampleMethod",
              "requestId": step.scenario.requestId,
              "requestType": "link",
              "actionFlow": "implicit"
            }
          ]));
          assert.equal(step.tracer.toMessage.callCount, step.tracer.add.callCount);
          if (step.scenario.output.error == null) {
            assert.deepEqual(_cleanup_toMessage_Args(step.tracer.toMessage.callArgs), [
              [
                {
                  "text": "#{objectName}.#{methodName} - Request[#{requestId}] is invoked",
                  "info": step.scenario.input[0]
                }
              ], [
                {
                  "text": "#{objectName}.#{methodName} - Request[#{requestId}] has finished",
                  "info": {
                    "msg": "This is a normal result"
                  }
                }
              ]
            ]);
          } else {
            assert.deepEqual(_cleanup_toMessage_Args(step.tracer.toMessage.callArgs), [
              [
                {
                  "text": "#{objectName}.#{methodName} - Request[#{requestId}] is invoked",
                  "info": step.scenario.input[0]
                }
              ], [
                {
                  "text": "#{objectName}.#{methodName} - Request[#{requestId}] has failed",
                  "info": {
                    "error_code": undefined,
                    "error_message": "The action has been failed"
                  }
                }
              ]
            ]);
          }
        })
        // verify proxyState
        assert.deepEqual(r.proxyState, {
          "methodType": undefined,
          "counter": {
            "promise": 1,
            "callback": 0,
            "general": 0
          },
          "pointer": {
            "current": "promise",
            "actionFlow": "implicit",
            "preciseThreshold": 3
          }
        });
        return r;
      });
    });

    it('function at the end of arguments list must not be changed when auto-detecting methodType', function() {
      var func = function() {}
      func.Router = function(req, res, next) {}
      
      var object = {
        sampleMethod: sinon.stub().callsFake(function() {
          return chores.argumentsToArray(arguments);
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
        objectName: 'object',
        method: object.sampleMethod,
        methodName: 'sampleMethod',
        texture: lodash.merge({}, DEFAULT_TEXTURE),
        logger: logger,
        tracer: tracer
      });

      var output = loggingProxy.capsule.apply(null, [
        "Hello world", { requestId: "53b2ce29-8c37-41ce-a9d2-94f03511d4e2" }, func
      ]);
      var lastArg = output[output.length - 1];

      assert.isFunction(lastArg);
      assert.notEqual(lastArg, func);
      assert.isFunction(lastArg.Router);
      assert.equal(lastArg.Router, func.Router);

      var tracerState = _captureTracerState(tracer);
      assert.equal(tracerState.add.callCount, 2);
      assert.deepEqual(tracerState.add.callArgs, lodash.fill(Array(2), [
        {
          "objectName": "object",
          "methodName": "sampleMethod",
          "requestId": "53b2ce29-8c37-41ce-a9d2-94f03511d4e2",
          "requestType": "link",
          "actionFlow": "implicit"
        }
      ]));
      assert.equal(tracerState.toMessage.callCount, 2);
      assert.deepEqual(tracerState.toMessage.callArgs, [
        [
          {
            "text": "Req[#{requestId}] #{objectName}.#{methodName}() #{requestType}",
            "info": [ "string", { "requestId": "string" }, "function" ]
          }
        ],
        [
          {
            "text": "Req[#{requestId}] #{objectName}.#{methodName}() completed",
            "info": [ "string", { "requestId": "string" }, "function" ]
          }
        ]
      ]);
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

    it('mocking return a Promise when texture.methodType is "promise', function() {
      var generate = sinon.stub();
      generate.withArgs("Will be success").returns("Action completed");
      generate.withArgs("Will be failure").throws(new Error("Failed anyway"));
      var texture = {
        methodType: "promise",
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

    it('mocking push result to callback if texture.methodType is "callback" and the last argument is a callback', function() {
      var generate = sinon.stub();
      generate.withArgs("Will be success").returns("Action completed");
      generate.withArgs("Will be failure").throws(new Error("Failed anyway"));
      var texture = {
        methodType: "callback",
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

    it('mocking return a normal result if texture.methodType is undefined and the last argument is NOT a callback', function() {
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

  describe('getTextureByPath()', function() {
    var ObjectDecorator = rewire(lab.getDevebotModule('backbone/object-decorator'));
    var DEFAULT_TEXTURE = ObjectDecorator.__get__('DEFAULT_TEXTURE');
    var getTextureByPath = ObjectDecorator.__get__('getTextureByPath');
    var textureOfBean = {
      methods: {
        bean: {
          connect: DEFAULT_TEXTURE
        },
        getConfig: DEFAULT_TEXTURE
      }
    };

    it('should return texture object for correct dialect descriptions', function() {
      assert.isObject(getTextureByPath({
        textureOfBean: lodash.assign({}, textureOfBean),
        methodName: 'getConfig'
      }));
      assert.isObject(getTextureByPath({
        textureOfBean: lodash.assign({}, textureOfBean),
        fieldChain: ['bean'],
        methodName: 'connect'
      }));
    });

    it('should propagate enabled field if textureOfBean.enabled is false', function() {
      assert.equal(getTextureByPath({
        textureOfBean: lodash.assign({ enabled: false }, textureOfBean),
        methodName: 'getConfig'
      }).enabled, false);
      assert.equal(getTextureByPath({
        textureOfBean: lodash.assign({ enabled: false }, textureOfBean),
        fieldChain: ['bean'],
        methodName: 'connect'
      }).enabled, false);
    });
  });

  describe('getTextureOfBridge()', function() {
    var ObjectDecorator = rewire(lab.getDevebotModule('backbone/object-decorator'));
    var DEFAULT_TEXTURE = ObjectDecorator.__get__('DEFAULT_TEXTURE');
    var getTextureOfBridge = ObjectDecorator.__get__('getTextureOfBridge');
    var textureStore = {
      bridges: {
        sampleBridge: {
          samplePlugin: {
            instance: {
              methods: {
                connect: DEFAULT_TEXTURE,
                getConfig: DEFAULT_TEXTURE
              }
            }
          }
        }
      }
    };

    it('should return texture object for correct dialect descriptions', function() {
      assert.isObject(getTextureOfBridge({
        textureStore: lodash.assign({}, textureStore),
        pluginCode: 'samplePlugin',
        bridgeCode: 'sampleBridge',
        dialectName: 'instance'
      }));
    });

    it('should propagate enabled field if textureStore.enabled is false', function() {
      assert.equal(getTextureOfBridge({
        textureStore: lodash.assign({ enabled: false }, textureStore),
        pluginCode: 'samplePlugin',
        bridgeCode: 'sampleBridge',
        dialectName: 'instance'
      }).enabled, false);
    });
  });

  describe('getTextureOfPlugin()', function() {
    var ObjectDecorator = rewire(lab.getDevebotModule('backbone/object-decorator'));
    var DEFAULT_TEXTURE = ObjectDecorator.__get__('DEFAULT_TEXTURE');
    var getTextureOfPlugin = ObjectDecorator.__get__('getTextureOfPlugin');
    var textureStore = {
      application: {
        reducers: {
          etaReducer: {
            methods: {
              estimateDistance: DEFAULT_TEXTURE
            }
          }
        },
        services: {
          pricingService: {
            methods: {
              calculate: DEFAULT_TEXTURE,
              getConfig: DEFAULT_TEXTURE
            }
          }
        }
      },
      plugins: {
        samplePlugin: {
          reducers: {
            etaReducer: {
              methods: {
                estimateDistance: DEFAULT_TEXTURE
              }
            }
          },
          services: {
            pricingService: {
              methods: {
                calculate: DEFAULT_TEXTURE,
                getConfig: DEFAULT_TEXTURE
              }
            }
          }
        }
      }
    };

    it('should return texture object for correct gadget descriptions', function() {
      assert.isObject(getTextureOfPlugin({
        textureStore: lodash.assign({}, textureStore),
        pluginCode: 'application',
        gadgetType: 'reducers',
        gadgetName: 'etaReducer'
      }));
      assert.isObject(getTextureOfPlugin({
        textureStore: lodash.assign({}, textureStore),
        pluginCode: 'application',
        gadgetType: 'services',
        gadgetName: 'pricingService'
      }));
      assert.isObject(getTextureOfPlugin({
        textureStore: lodash.assign({}, textureStore),
        pluginCode: 'samplePlugin',
        gadgetType: 'reducers',
        gadgetName: 'etaReducer'
      }));
      assert.isObject(getTextureOfPlugin({
        textureStore: lodash.assign({}, textureStore),
        pluginCode: 'samplePlugin',
        gadgetType: 'services',
        gadgetName: 'pricingService'
      }));
    });

    it('should propagate enabled field if textureStore.enabled is false', function() {
      assert.equal(getTextureOfPlugin({
        textureStore: lodash.assign({ enabled: false }, textureStore),
        pluginCode: 'application',
        gadgetType: 'reducers',
        gadgetName: 'etaReducer'
      }).enabled, false);
      assert.equal(getTextureOfPlugin({
        textureStore: lodash.assign({ enabled: false }, textureStore),
        pluginCode: 'application',
        gadgetType: 'services',
        gadgetName: 'pricingService'
      }).enabled, false);
      assert.equal(getTextureOfPlugin({
        textureStore: lodash.assign({ enabled: false }, textureStore),
        pluginCode: 'samplePlugin',
        gadgetType: 'reducers',
        gadgetName: 'etaReducer'
      }).enabled, false);
      assert.equal(getTextureOfPlugin({
        textureStore: lodash.assign({ enabled: false }, textureStore),
        pluginCode: 'samplePlugin',
        gadgetType: 'services',
        gadgetName: 'pricingService'
      }).enabled, false);
    });
  });

  after(function() {
    LogTracer.clearInterceptors();
    envmask.reset();
  });
});
