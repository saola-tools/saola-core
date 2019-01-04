'use strict';

var lab = require('../index');
var Devebot = lab.getDevebot();
var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');
var chores = Devebot.require('chores');
var errors = require(lab.getDevebotModule('utils/errors'));
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
      LOGOLITE_ALWAYS_MUTED: 'all',
      NODE_ENV: 'test'
    });
    LogConfig.reset();
  });

  describe('wrapMethod()', function() {
    var ObjectDecorator = rewire(lab.getDevebotModule('backbone/object-decorator'));
    var wrapMethod = ObjectDecorator.__get__('wrapMethod');
    var loggingFactory = lab.createLoggingFactoryMock({ captureMethodCall: false });
    var refs = { L: loggingFactory.getLogger(), T: loggingFactory.getTracer() }

    beforeEach(function() {
      loggingFactory.resetHistory();
    })

    it('skip wrapping a method if texture is undefined or disabled', function() {
      var originalMethod = sinon.stub();
      assert.equal(wrapMethod(refs, originalMethod), originalMethod);
      assert.equal(wrapMethod(refs, originalMethod, {}), originalMethod);
      assert.equal(wrapMethod(refs, originalMethod, { texture: {} }), originalMethod);
      assert.equal(wrapMethod(refs, originalMethod, { texture: { enabled: false } }), originalMethod);
      assert.equal(wrapMethod(refs, originalMethod, { texture: { logging: { enabled: false } } }), originalMethod);
      assert.equal(wrapMethod(refs, originalMethod, { texture: { mocking: { enabled: false } } }), originalMethod);
      assert.equal(wrapMethod(refs, originalMethod, { texture: { mocking: {} } }), originalMethod);
      assert.notEqual(wrapMethod(refs, originalMethod, { texture: { mocking: { mappings: { default_rule: {} } } } }), originalMethod);
      assert.notEqual(wrapMethod(refs, originalMethod, { texture: { logging: {} } }), originalMethod);
    });

    it('should wrap a method if texture is defined', function() {
      var originalMethod = sinon.stub();
      var wrappedMethod = wrapMethod(refs, originalMethod, { texture: { logging: {} } });
      assert.notEqual(wrappedMethod, originalMethod);
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
      var wrappedMethod = wrapMethod(refs, object.sampleMethod, {
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
      var wrappedMethod = wrapMethod(refs, object.sampleMethod, {
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
      var wrappedMethod = wrapMethod(refs, object.sampleMethod, {
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

    var loggingFactory = lab.createLoggingFactoryMock({ captureMethodCall: false });
    var refs = { L: loggingFactory.getLogger(), T: loggingFactory.getTracer() }

    // Default example constructor
    var ExampleConstructor = function () {}
      ExampleConstructor.prototype.calculate = function() {}
      ExampleConstructor.prototype.getConfig = function() {}

    beforeEach(function() {
      wrapObject.resetHistory();
    });

    it('skip wrapping a constructor if textureOfBean is undefined or null', function() {
      var opts = {}
      assert.equal(wrapConstructor(refs, ExampleConstructor, opts), ExampleConstructor);
      opts = { textureOfBean: null }
      assert.equal(wrapConstructor(refs, ExampleConstructor, opts), ExampleConstructor);
      opts = { textureOfBean: {} }
      assert.notEqual(wrapConstructor(refs, ExampleConstructor, opts), ExampleConstructor);
    });

    it('skip wrapping a constructor if textureOfBean.enabled is false', function() {
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

    it('should wrap a constructor that will be invoked by the "new" operator', function() {
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
    var loggingFactory = lab.createLoggingFactoryMock();
    var refs = { L: loggingFactory.getLogger(), T: loggingFactory.getTracer() }

    beforeEach(function() {
      loggingFactory.resetHistory();
      wrapMethod.resetHistory();
    })

    it('should wrap all of public methods of a bean with empty textureStore', function() {
      var textureOfBean = {};
      var mockedBean = {
        method1: sinon.stub(),
        method2: sinon.stub()
      }
      var wrappedBean = wrapObject(refs, mockedBean, {
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
      var wrappedBean = wrapObject(refs, mockedBean, {
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
      var wrappedBean = wrapObject(refs, mockedBean, {
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
      let logState_method1 = loggingFactory.getTracerStore().add.filter(item => {
        return ('requestId' in item && item.methodName === 'method1');
      });
      assert.equal(logState_method1.length, 3 * 2);
      let logState_method2 = loggingFactory.getTracerStore().add.filter(item => {
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
      var wrappedBean = wrapObject(refs, mockedBean, {
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
      let logState_invoice = loggingFactory.getTracerStore().add.filter(item => {
        return ('requestId' in item && item.methodName === 'invoice');
      });
      assert.equal(logState_invoice.length, requestCount * 2);
      //verify tracer for summarize()
      let logState_summarize = loggingFactory.getTracerStore().add.filter(item => {
        return ('requestId' in item && item.methodName === 'summarize');
      });
      assert.equal(logState_summarize.length, requestCount * 2);
      //verify tracer for getRate()
      let logState_getRate = loggingFactory.getTracerStore().add.filter(item => {
        return ('requestId' in item && item.methodName === 'getRate');
      });
      assert.equal(logState_getRate.length, 0);
    });

    it('should skip wrapping the result of method call that returns the owner', function() {
      var textureOfBean = {
        methods: {
          parent: { child: { self: lodash.cloneDeep(DEFAULT_TEXTURE) } }
        }
      }
      var mockedBean = {
        parent: { child: { self: function() {
          return this;
        } } }
      }
      var wrappedBean = wrapObject(refs, mockedBean, {
        textureOfBean: textureOfBean,
        objectName: 'originalBean'
      });

      assert.notEqual(wrappedBean, mockedBean);
      assert.notEqual(wrappedBean.parent, mockedBean.parent);
      assert.notEqual(wrappedBean.parent.child, mockedBean.parent.child);

      assert.equal(wrappedBean.parent, wrappedBean.parent);
      assert.equal(wrappedBean.parent.child, wrappedBean.parent.child);
      assert.equal(wrappedBean.parent.child.self, wrappedBean.parent.child.self);

      assert.isFunction(wrappedBean.parent.child.self);
      assert.equal(wrappedBean.parent.child, wrappedBean.parent.child.self());
    });

    function createWrappedBean(textureOpts) {
      var textureOfBean = {
        methods: {
          start: lodash.cloneDeep(DEFAULT_TEXTURE),
          parent: { child: { getBean: lodash.assign(textureOpts, DEFAULT_TEXTURE) } },
          "parent.child.getBean.invoice": lodash.cloneDeep(DEFAULT_TEXTURE),
          "parent.child.getBean.summarize": lodash.cloneDeep(DEFAULT_TEXTURE)
        }
      }
      var mockedBean = {
        start: function(amount, opts) {
          return this.parent.child.getBean().invoice(amount, opts);
        },
        parent: { child: { getBean: function() {
          return new (function() {
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
            this.rate = 1.1;
          })()
        } } }
      }
      var wrappedBean = wrapObject(refs, mockedBean, {
        textureOfBean: textureOfBean,
        objectName: 'originalBean'
      });
      return wrappedBean;
    }

    it('should not decorate the returned object of methods calls if recursive is undefined', function() {
      // number of requests
      const requestCount = 5;
      const wrappedBean = createWrappedBean({});
      // invokes start() "requestCount" times
      const msgs = lodash.range(requestCount).map(function(i) {
        return wrappedBean.start(100 + i);
      });
      assert.deepEqual(msgs, [
        "Total: 100",
        "Total: 101",
        "Total: 102",
        "Total: 103",
        "Total: 104"
      ]);
      // verify wrapMethod()
      assert.equal(wrapMethod.callCount, 2); // start, getBean only
      //verify tracer for getBean()
      let logState_getBean = loggingFactory.getTracerStore().add.filter(item => {
        return ('requestId' in item && item.methodName === 'getBean');
      });
      assert.equal(logState_getBean.length, requestCount * 2);
      //verify tracer for invoice()
      let logState_invoice = loggingFactory.getTracerStore().add.filter(item => {
        return ('requestId' in item && item.methodName === 'invoice');
      });
      assert.equal(logState_invoice.length, 0);
      //verify tracer for summarize()
      let logState_summarize = loggingFactory.getTracerStore().add.filter(item => {
        return ('requestId' in item && item.methodName === 'summarize');
      });
      assert.equal(logState_summarize.length, 0);
      //verify tracer for getRate()
      let logState_getRate = loggingFactory.getTracerStore().add.filter(item => {
        return ('requestId' in item && item.methodName === 'getRate');
      });
      assert.equal(logState_getRate.length, 0);
    });

    it('support decorating the returned object of methods calls (recursive: true)', function() {
      // number of requests
      const requestCount = 5;
      const wrappedBean = createWrappedBean({recursive: true});
      // invokes start() "requestCount" times
      const msgs = lodash.range(requestCount).map(function(i) {
        return wrappedBean.start(100 + i);
      });
      assert.deepEqual(msgs, [
        "Total: 100",
        "Total: 101",
        "Total: 102",
        "Total: 103",
        "Total: 104"
      ]);
      // verify wrapMethod()
      assert.equal(wrapMethod.callCount, 5); // start, getBean, invoice, summarize, getRate
      //verify tracer for getBean()
      let logState_getBean = loggingFactory.getTracerStore().add.filter(item => {
        return ('requestId' in item && item.methodName === 'getBean');
      });
      assert.equal(logState_getBean.length, requestCount * 2);
      //verify tracer for invoice()
      let logState_invoice = loggingFactory.getTracerStore().add.filter(item => {
        return ('requestId' in item && item.methodName === 'invoice');
      });
      assert.equal(logState_invoice.length, requestCount * 2);
      //verify tracer for summarize()
      let logState_summarize = loggingFactory.getTracerStore().add.filter(item => {
        return ('requestId' in item && item.methodName === 'summarize');
      });
      assert.equal(logState_summarize.length, requestCount * 2);
      //verify tracer for getRate()
      let logState_getRate = loggingFactory.getTracerStore().add.filter(item => {
        return ('requestId' in item && item.methodName === 'getRate');
      });
      assert.equal(logState_getRate.length, 0);
    });

    it('should support logging templates that contain the streamId', function() {
      var loggingFactory = lab.createLoggingFactoryMock();
      function _extractLogInfo(tracerStore) {
        return {
          add: tracerStore.add.map(arg => lodash.pick(arg, ['requestId', 'streamId'])),
          toMessage: tracerStore.toMessage.map(arg => lodash.pick(arg, ['text'])),
        }
      }
      var textureOfBean = {}
      var mockedBean = {
        method1: sinon.stub(),
        method2: sinon.stub(),
      }
      var wrappedBean = wrapObject(refs, mockedBean, {
        logger: loggingFactory.getLogger(),
        tracer: loggingFactory.getTracer(),
        textureOfBean: textureOfBean,
        supportAllMethods: true,
        useDefaultTexture: true,
        objectName: 'originalBean',
        streamId: "AtEBb0vPQIWzmLVDGP7zyg@0.1.0"
      });
      wrappedBean.method1("Hello world!", { requestId: "HJbTk3z4TFiBcNbG6SCycg" });
      wrappedBean.method2("How are you?", { requestId: "sad2rAQ0TX-C55idWsAMrw" });
      var tracerStore = loggingFactory.getTracerStore();
      false && console.log(JSON.stringify(tracerStore, null, 2));
      assert.deepEqual(_extractLogInfo(tracerStore), {
        "add": [
          {
            "requestId": "HJbTk3z4TFiBcNbG6SCycg",
            "streamId": "AtEBb0vPQIWzmLVDGP7zyg@0.1.0"
          },
          {
            "requestId": "HJbTk3z4TFiBcNbG6SCycg",
            "streamId": "AtEBb0vPQIWzmLVDGP7zyg@0.1.0"
          },
          {
            "requestId": "sad2rAQ0TX-C55idWsAMrw",
            "streamId": "AtEBb0vPQIWzmLVDGP7zyg@0.1.0"
          },
          {
            "requestId": "sad2rAQ0TX-C55idWsAMrw",
            "streamId": "AtEBb0vPQIWzmLVDGP7zyg@0.1.0"
          }
        ],
        "toMessage": [
          {
            "text": "Req[#{requestId}/#{streamId}] #{objectName}.#{methodName}() #{requestType}"
          },
          {
            "text": "Req[#{requestId}/#{streamId}] #{objectName}.#{methodName}() completed"
          },
          {
            "text": "Req[#{requestId}/#{streamId}] #{objectName}.#{methodName}() #{requestType}"
          },
          {
            "text": "Req[#{requestId}/#{streamId}] #{objectName}.#{methodName}() completed"
          }
        ]
      });
    })
  });

  describe('wrapBridgeDialect()', function() {
    var loggingFactory = lab.createLoggingFactoryMock();
    var nameResolver = lab.getNameResolver(['simple-plugin'], ['simple-bridge']);
    var issueInspector = {};
    var schemaValidator = {};

    beforeEach(function() {
      loggingFactory.resetHistory();
    })

    it('should wrap all of methods of a bridge-dialect with empty textureStore', function() {
      var objectDecorator = lab.initBackboneService('object-decorator', {
        appInfo: {},
        profileConfig: {},
        textureConfig: {},
        loggingFactory: loggingFactory,
        nameResolver: nameResolver,
        issueInspector: issueInspector,
        schemaValidator: schemaValidator
      });

      // define Constructor
      var mockedBean = {
        method1: sinon.stub(),
        method2: sinon.stub()
      }
      var MockedConstructor = function() {
        this.method1 = mockedBean.method1
        this.method2 = mockedBean.method2
      }

      // wrapping Constructor
      var WrappedConstructor = objectDecorator.wrapBridgeDialect(MockedConstructor, {
        pluginName: 'simple-plugin',
        bridgeName: 'simple-bridge',
        dialectName: 'connector',
        useDefaultTexture: false,
      });
      assert.equal(WrappedConstructor, MockedConstructor);

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
      var tracerStore = loggingFactory.getTracerStore();
      var logState_method1 = tracerStore.add.filter(item => {
        return ('requestId' in item && item.methodName === 'method1');
      });
      assert.equal(logState_method1.length, 0);
      var logState_method2 = tracerStore.add.filter(item => {
        return ('requestId' in item && item.methodName === 'method2');
      });
      assert.equal(logState_method2.length, 0);
    });

    it('should wrap deep located methods of a bridge-dialect', function() {
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
        bridges: {
          simpleBridge: {
            simplePlugin: {
              connector: {
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
        appInfo: {},
        profileConfig: {},
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
      var WrappedConstructor = objectDecorator.wrapBridgeDialect(MockedConstructor, {
        pluginName: 'simple-plugin',
        bridgeName: 'simple-bridge',
        dialectName: 'connector',
        useDefaultTexture: false,
      });
      assert.notEqual(WrappedConstructor, MockedConstructor);

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
      var tracerStore = loggingFactory.getTracerStore();
      var logState_method1 = tracerStore.add.filter(item => {
        return ('requestId' in item && item.methodName === 'method1');
      });
      assert.equal(logState_method1.length, 3 * 2);
      var logState_method2 = tracerStore.add.filter(item => {
        return ('requestId' in item && item.methodName === 'method2');
      });
      assert.equal(logState_method2.length, 5 * 2);
    });
  });

  describe('wrapPluginGadget()', function() {
    var loggingFactory = lab.createLoggingFactoryMock();
    var nameResolver = lab.getNameResolver(['simple-plugin'], []);
    var issueInspector = {};
    var schemaValidator = {};

    beforeEach(function() {
      loggingFactory.resetHistory();
    })

    it('should wrap all of methods of a plugin-gadget with empty textureStore', function() {
      var objectDecorator = lab.initBackboneService('object-decorator', {
        appInfo: {},
        profileConfig: {},
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
      assert.equal(WrappedConstructor, MockedConstructor);

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
      var tracerStore = loggingFactory.getTracerStore();
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
        appInfo: {},
        profileConfig: {},
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
      assert.notEqual(WrappedConstructor, MockedConstructor);

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
      var tracerStore = loggingFactory.getTracerStore();
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
        let toMessageArgs = lodash.cloneDeep(tracer.toMessage.getCall(i).args);
        if (lodash.isArray(toMessageArgs) && toMessageArgs.length > 1 && toMessageArgs[1] == 'direct') {
          toMessageArgs.splice(1);
        }
        tracerState.toMessage.callArgs.push(toMessageArgs);
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

      var loggingFactory = lab.createLoggingFactoryMock({ instanceId: "NS3Csx_9RTC6NBI9HXVv0Q" });

      var loggingProxy = new LoggingInterceptor({
        object: object,
        objectName: params.methodType + 'Mode',
        method: object.sampleMethod,
        methodName: 'sampleMethod',
        texture: texture,
        logger: loggingFactory.getLogger(),
        tracer: loggingFactory.getTracer(),
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
            flowState.tracer = _captureTracerState(loggingFactory.getTracer());
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
              onResolved(flowState);
            });
            var output = loggingProxy.capsule.apply(null, parameters);
            assert.isUndefined(output);
          }).then(function(flowState) {
            flowState.tracer = _captureTracerState(loggingFactory.getTracer());
            return flowState;
          });
        }
        if (methodType === 'general') {
          flowState.result = {};
          try {
            flowState.result.value = loggingProxy.capsule.apply(null, parameters);
          } catch (error) {
            flowState.result.error = error;
          }
          flowState.tracer = _captureTracerState(loggingFactory.getTracer());
          return flowState;
        }
      })

      p = p.then(function(flowStates) {
        return {
          flowStates: flowStates,
          proxyState: loggingProxy.getState()
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
            "reqContext": {},
            "requestId": "YkMjPoSoSyOTrLyf76Mzqg",
            "requestType": "link",
            "actionFlow": "implicit",
            "streamId": undefined
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
            "reqContext": {},
            "requestId": "YkMjPoSoSyOTrLyf76Mzqg",
            "requestType": "link",
            "actionFlow": "implicit",
            "streamId": undefined
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
        assert.equal(step.tracer.add.callCount, 3);
        assert.deepEqual(step.tracer.add.callArgs, lodash.fill(Array(step.tracer.add.callCount), [
          {
            "objectName": "callbackMode",
            "methodName": "sampleMethod",
            "reqContext": {},
            "requestId": "YkMjPoSoSyOTrLyf76Mzqg",
            "requestType": "link",
            "actionFlow": "implicit",
            "streamId": undefined
          }
        ]));
        assert.equal(step.tracer.toMessage.callCount, 3);
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
          ],
          [
            {
              "text": "#{objectName}.#{methodName} - Request[#{requestId}] has finished",
              "info": undefined
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
        assert.equal(step.tracer.add.callCount, 3);
        assert.deepEqual(step.tracer.add.callArgs, lodash.fill(Array(step.tracer.add.callCount), [
          {
            "objectName": "callbackMode",
            "methodName": "sampleMethod",
            "reqContext": {},
            "requestId": "YkMjPoSoSyOTrLyf76Mzqg",
            "requestType": "link",
            "actionFlow": "implicit",
            "streamId": undefined
          }
        ]));
        assert.equal(step.tracer.toMessage.callCount, 3);
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
          ],
          [
            {
              "text": "#{objectName}.#{methodName} - Request[#{requestId}] has finished",
              "info": undefined
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
            "reqContext": {},
            "requestId": "YkMjPoSoSyOTrLyf76Mzqg",
            "requestType": "link",
            "actionFlow": "implicit",
            "streamId": undefined
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
            "reqContext": {},
            "requestId": "YkMjPoSoSyOTrLyf76Mzqg",
            "requestType": "link",
            "actionFlow": "implicit",
            "streamId": undefined
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
            "reqContext": {},
            "requestId": "YkMjPoSoSyOTrLyf76Mzqg",
            "requestType": "link",
            "actionFlow": "explicit",
            "streamId": undefined
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
            "reqContext": {},
            "requestId": "YkMjPoSoSyOTrLyf76Mzqg",
            "requestType": "link",
            "actionFlow": "explicit",
            "streamId": undefined
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
            "reqContext": {},
            "requestId": "YkMjPoSoSyOTrLyf76Mzqg",
            "requestType": "link",
            "actionFlow": "explicit",
            "streamId": undefined
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
            "reqContext": {},
            "requestId": "YkMjPoSoSyOTrLyf76Mzqg",
            "requestType": "link",
            "actionFlow": "explicit",
            "streamId": undefined
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
            "reqContext": {},
            "requestId": "YkMjPoSoSyOTrLyf76Mzqg",
            "requestType": "link",
            "actionFlow": "explicit",
            "streamId": undefined
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
            "reqContext": {},
            "requestId": "YkMjPoSoSyOTrLyf76Mzqg",
            "requestType": "link",
            "actionFlow": "explicit",
            "streamId": undefined
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
              "reqContext": {},
              "requestId": step.scenario.requestId,
              "requestType": "link",
              "actionFlow": actionFlow,
              "streamId": undefined
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
              "reqContext": {},
              "requestId": step.scenario.requestId,
              "requestType": "link",
              "actionFlow": actionFlow,
              "streamId": undefined
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
              "reqContext": {},
              "requestId": step.scenario.requestId,
              "requestType": "link",
              "actionFlow": actionFlow,
              "streamId": undefined
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
              "reqContext": {},
              "requestId": step.scenario.requestId,
              "requestType": "link",
              "actionFlow": "implicit",
              "streamId": undefined
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
      var loggingFactory = lab.createLoggingFactoryMock({ instanceId: 'X25Xv2HNQPyeD22SyjuCiw' });
      var func = function() {}
      func.Router = function(req, res, next) {}

      var object = {
        sampleMethod: sinon.stub().callsFake(function() {
          return chores.argumentsToArray(arguments);
        })
      }

      var loggingProxy = new LoggingInterceptor({
        object: object,
        objectName: 'object',
        method: object.sampleMethod,
        methodName: 'sampleMethod',
        texture: lodash.merge({}, DEFAULT_TEXTURE),
        logger: loggingFactory.getLogger(),
        tracer: loggingFactory.getTracer()
      });

      var output = loggingProxy.capsule("Hello world", {requestId: "94f03511d4e2" }, func);
      var lastArg = output[output.length - 1];

      assert.isFunction(lastArg);
      assert.notEqual(lastArg, func);
      assert.isFunction(lastArg.Router);
      assert.equal(lastArg.Router, func.Router);

      var tracerState = _captureTracerState(loggingFactory.getTracer());
      assert.equal(tracerState.add.callCount, 2);
      assert.deepEqual(tracerState.add.callArgs, lodash.fill(Array(2), [
        {
          "objectName": "object",
          "methodName": "sampleMethod",
          "reqContext": {},
          "requestId": "94f03511d4e2",
          "requestType": "link",
          "actionFlow": "implicit",
          "streamId": undefined
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

    it('getRequestId/extractInfo runs on its own context (reqContext)', function() {
      var loggingFactory = lab.createLoggingFactoryMock();

      var timeoutMap = {
        "Req#0": 150,
        "Req#1": 5,
        "Req#2": 100
      }
      var object = {
        sampleMethod: sinon.stub().callsFake(function() {
          var requestId = arguments[1].requestId;
          var callback = arguments[2];
          var timeout = timeoutMap[requestId] || 0;
          setTimeout(callback, timeout);
        })
      }

      var loggingProxy = new LoggingInterceptor({
        object: object,
        objectName: 'object',
        method: object.sampleMethod,
        methodName: 'sampleMethod',
        texture: lodash.merge({}, DEFAULT_TEXTURE, {
          logging: {
            onRequest: {
              getRequestId: function(argumentsList) {
                let reqId = argumentsList[1].requestId;
                this.requestId = reqId;
                this.messageOf = argumentsList[0].replace('Msg', 'Req');
                return reqId;
              },
              extractInfo: function(argumentsList) {
                return chores.extractObjectInfo(chores.argumentsToArray(argumentsList));
              }
            },
            onSuccess: {
              extractInfo: function(value) {
                return { requestId: this.requestId, messageOf: this.messageOf };
              }
            },
            onFailure: {
              extractInfo: function(error) {
                return { errorName: error.name, errorMessage: error.message }
              }
            }
          }
        }),
        logger: loggingFactory.getLogger(),
        tracer: loggingFactory.getTracer()
      });

      var p = Promise.map(lodash.range(3), function(i) {
        return new Promise(function(onResolved, onRejected) {
          loggingProxy.capsule("Msg#" + i, { requestId: "Req#" + i }, function(error, value) {
            onResolved({error, value});
          })
        })
      });

      p = p.then(function(results) {
        var tracerStore = loggingFactory.getTracerStore();
        false && console.log('toMessage: %s', JSON.stringify(tracerStore.toMessage, null, 2));
        var toMessageState = lodash.filter(tracerStore.toMessage, function(logMsg) {
          return logMsg && logMsg.info && logMsg.info.requestId;
        });
        var toMessageInfos = lodash.map(toMessageState, function(logMsg) {
          return logMsg.info.requestId === logMsg.info.messageOf;
        })
        assert.lengthOf(toMessageInfos, 6);
        assert.lengthOf(lodash.uniq(toMessageInfos), 1);
        return results;
      })

      return p;
    });

    it('defined streamId must be propagated to logState object', function() {
      var loggingFactory = lab.createLoggingFactoryMock();

      var object = {
        sampleMethod: sinon.stub().callsFake(function() {
          var opts = arguments[1];
          var output = { message: arguments[0], requestId: opts.requestId };
          switch(opts.methodType) {
            case 'promise':
              return Promise.resolve(output);
            case 'callback':
              var callback = arguments[2];
              return callback(null, output);
            case 'general':
              return output;
          }
        })
      }

      var loggingProxy = new LoggingInterceptor({
        object: object,
        objectName: 'object',
        method: object.sampleMethod,
        methodName: 'sampleMethod',
        texture: lodash.merge({}, DEFAULT_TEXTURE),
        logger: loggingFactory.getLogger(),
        tracer: loggingFactory.getTracer(),
        streamId: "AtEBb0vPQIWzmLVDGP7zyg@0.1.0"
      });

      function _extractLogInfo(tracerStore) {
        return {
          add: tracerStore.add.map(arg => lodash.pick(arg, ['requestId', 'streamId'])),
        }
      }

      return loggingProxy.capsule("Hello world", {
        requestId: "94f03511d4e1",
        methodType: "promise"
      }).then(function(result) {
        assert.deepEqual(result, { message: "Hello world", requestId: "94f03511d4e1" });
        var tracerStore = loggingFactory.getTracerStore();
        false && console.log(JSON.stringify(tracerStore, null, 2));
        assert.deepEqual(_extractLogInfo(tracerStore), {
          add: [
            {
              "requestId": "94f03511d4e1",
              "streamId": "AtEBb0vPQIWzmLVDGP7zyg@0.1.0"
            },
            {
              "requestId": "94f03511d4e1",
              "streamId": "AtEBb0vPQIWzmLVDGP7zyg@0.1.0"
            }
          ]
        });
        loggingFactory.resetHistory();
      });
    });
  });

  describe('LoggingInterceptor', function() {
    var ObjectDecorator = rewire(lab.getDevebotModule('backbone/object-decorator'));
    var LoggingInterceptor = ObjectDecorator.__get__('LoggingInterceptor');
    var DEFAULT_TEXTURE = ObjectDecorator.__get__('DEFAULT_TEXTURE');

    var loggingFactory = lab.createLoggingFactoryMock();

    var object = {
      sampleMethod: sinon.stub().callsFake(function() {
        var opts = arguments[1];
        var output = { message: arguments[0], requestId: opts.requestId };
        switch(opts.methodType) {
          case 'promise':
            return Promise.resolve(output);
          case 'callback':
            var callback = arguments[2];
            return callback(null, output);
          case 'general':
            return output;
        }
      })
    }

    var loggingProxy = new LoggingInterceptor({
      object: object,
      objectName: 'object',
      method: object.sampleMethod,
      methodName: 'sampleMethod',
      texture: lodash.merge({}, DEFAULT_TEXTURE, {
        logging: {
          onRequest: {
            getRequestId: function(argumentsList) {
              let obj = null;
              return obj.requestId;
            },
            extractInfo: function(argumentsList) {
              return Object.keys(argumentsList[1000]);
            }
          },
          onSuccess: {
            extractInfo: function(value) {
              return chores.extractObjectInfo(valua);
            }
          },
          onFailure: {
            extractInfo: function(error) {
              return { errorName: error.name, errorMessage: error.message }
            }
          }
        }
      }),
      logger: loggingFactory.getLogger(),
      tracer: loggingFactory.getTracer()
    });

    function _extractLogInfo(tracerStore) {
      return {
        add: tracerStore.add.map(arg => lodash.pick(arg, ['requestId'])),
        toMessage: tracerStore.toMessage.map(arg => lodash.pick(arg, ['info']))
      }
    }

    it('wrap getRequestId/extractInfo invocations inside try-catch blocks: promise', function() {
      // methodType: promise
      return loggingProxy.capsule("Hello world", {
        requestId: "94f03511d4e1",
        methodType: "promise"
      }).then(function(result) {
        assert.deepEqual(result, { message: "Hello world", requestId: "94f03511d4e1" });
        var tracerStore = loggingFactory.getTracerStore();
        false && console.log(JSON.stringify(tracerStore, null, 2));
        assert.deepEqual(_extractLogInfo(tracerStore), {
          add: [
            {
              "requestId": "getRequestId-throw-an-error"
            },
            {
              "requestId": "getRequestId-throw-an-error"
            }
          ],
          toMessage: [
            {
              "info": {
                "event": "onRequest",
                "errorName": "TypeError",
                "errorMessage": "Cannot convert undefined or null to object"
              }
            },
            {
              "info": {
                "event": "onSuccess",
                "errorName": "ReferenceError",
                "errorMessage": "valua is not defined"
              }
            }
          ]
        });
        loggingFactory.resetHistory();
      });
    });

    it('wrap getRequestId/extractInfo invocations inside try-catch blocks: callback', function() {
      // methodType: callback
      return new Promise(function(onResolved, onRejected) {
        loggingProxy.capsule("Hello world", {
          requestId: "94f03511d4e2",
          methodType: "callback"
        }, function callback(error, result) {
          assert.deepEqual(result, { message: "Hello world", requestId: "94f03511d4e2" });
          var tracerStore = loggingFactory.getTracerStore();
          false && console.log(JSON.stringify(tracerStore, null, 2));
          assert.deepEqual(_extractLogInfo(tracerStore), {
            add: [
              {
                "requestId": "getRequestId-throw-an-error"
              },
              {
                "requestId": "getRequestId-throw-an-error"
              }
            ],
            toMessage: [
              {
                "info": {
                  "event": "onRequest",
                  "errorName": "TypeError",
                  "errorMessage": "Cannot convert undefined or null to object"
                }
              },
              {
                "info": {
                  "event": "onSuccess",
                  "errorName": "ReferenceError",
                  "errorMessage": "valua is not defined"
                }
              }
            ]
          });
          onResolved();
        });
      }).finally(function() {
        loggingFactory.resetHistory();
      });
    });

    it('wrap getRequestId/extractInfo invocations inside try-catch blocks: general', function() {
      // methodType: general
      var result = loggingProxy.capsule("Hello world", {
        requestId: "94f03511d4e3",
        methodType: "general"
      });
      assert.deepEqual(result, { message: "Hello world", requestId: "94f03511d4e3" });
      var tracerStore = loggingFactory.getTracerStore();
      false && console.log(JSON.stringify(tracerStore, null, 2));
      assert.deepEqual(_extractLogInfo(tracerStore), {
        add: [
          {
            "requestId": "getRequestId-throw-an-error"
          },
          {
            "requestId": "getRequestId-throw-an-error"
          }
        ],
        toMessage: [
          {
            "info": {
              "event": "onRequest",
              "errorName": "TypeError",
              "errorMessage": "Cannot convert undefined or null to object"
            }
          },
          {
            "info": {
              "event": "onSuccess",
              "errorName": "ReferenceError",
              "errorMessage": "valua is not defined"
            }
          }
        ]
      });
      loggingFactory.resetHistory();
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

    it('unmatched mocking request will invoke the target method if [unmatched] is undefined', function() {
      var generate = sinon.stub();
      generate.withArgs("Will be success").returns("Action completed");
      generate.withArgs("Will be failure").throws(new Error("Failed anyway"));
      var texture = {
        mocking: {
          mappings: {
            "matched#1": {
              selector: sinon.stub()
                  .onFirstCall().returns(true)
                  .onSecondCall().returns(false)
                  .onThirdCall().returns(false),
              generate: generate
            },
            "matched#2": {
              selector: sinon.stub()
                  .onFirstCall().returns(true)
                  .onSecondCall().returns(false),
              generate: generate
            }
          }
        }
      };
      var method = sinon.stub().returns("From original method");
      var mockingProxy = new MockingInterceptor({texture, method});

      var out_1 = mockingProxy.capsule("Will be success", { requestId: 'YkMjPoSoSyOTrLyf76Mzqg'});
      assert.equal(out_1, "Action completed");

      var out_2 = mockingProxy.capsule("Will be success", { requestId: 'YkMjPoSoSyOTrLyf76Mzqh'});
      assert.equal(out_2, "Action completed");

      var out_3 = mockingProxy.capsule("Will be success", { requestId: 'YkMjPoSoSyOTrLyf76Mzqh'});
      assert.equal(out_3, "From original method");

      assert.equal(method.callCount, 1);
      assert.equal(generate.callCount, 2);
    });

    it('unmatched mocking request will throw MockNotFoundError if [unmatched] is exception', function() {
      var generate = sinon.stub();
      generate.withArgs("Will be success").returns("Action completed");
      generate.withArgs("Will be failure").throws(new Error("Failed anyway"));
      var texture = {
        mocking: {
          mappings: {
            "matched#1": {
              selector: sinon.stub()
                  .onFirstCall().returns(true)
                  .onSecondCall().returns(false)
                  .onThirdCall().returns(false),
              generate: generate
            },
            "matched#2": {
              selector: sinon.stub()
                  .onFirstCall().returns(true)
                  .onSecondCall().returns(false),
              generate: generate
            }
          },
          unmatched: "exception"
        }
      };
      var method = sinon.stub();
      var mockingProxy = new MockingInterceptor({texture, method});

      var out_1 = mockingProxy.capsule("Will be success", { requestId: 'YkMjPoSoSyOTrLyf76Mzqg'});
      assert.equal(out_1, "Action completed");

      var out_2 = mockingProxy.capsule("Will be success", { requestId: 'YkMjPoSoSyOTrLyf76Mzqh'});
      assert.equal(out_2, "Action completed");

      assert.throw(function() {
        return mockingProxy.capsule("Will be success", { requestId: 'YkMjPoSoSyOTrLyf76Mzqi'})
      }, errors.assertConstructor("MockNotFoundError"), "All of selectors are unmatched");

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

    it('should do nothing if extracted texture is undefined', function() {
      assert.isUndefined(getTextureByPath({
        textureOfBean: {
          enabled: false,
          methods: {
            bean: { connect: DEFAULT_TEXTURE }
          }
        },
        methodName: 'unmanaged'
      }));
    });

    it('should do nothing if extracted texture is null', function() {
      assert.isNull(getTextureByPath({
        textureOfBean: {
          enabled: false,
          methods: {
            bean: {
              connect: DEFAULT_TEXTURE,
              unmanaged: null
            }
          }
        },
        fieldChain: ['bean'],
        methodName: 'unmanaged'
      }));
    });

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
      assert.deepEqual(getTextureByPath({
        textureOfBean: lodash.assign({}, textureOfBean),
        fieldChain: ['bean'],
        methodName: 'connect'
      }), DEFAULT_TEXTURE);
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

  describe('detectRequestId()', function() {
    var ObjectDecorator = rewire(lab.getDevebotModule('backbone/object-decorator'));
    var detectRequestId = ObjectDecorator.__get__('detectRequestId');
    it('should keep safety with any kind of arguments', function() {
      assert.doesNotThrow(function() {
        detectRequestId();
        detectRequestId(undefined);
        detectRequestId(null);
        detectRequestId([]);
        detectRequestId([null, 1, true, [], {}, function() {}]);
      }, Error);
      var reqId = (function() {
        return detectRequestId(arguments);
      })(
        { a: {}, b: null, c: function() {}, d: [], e: {} },
        { requestId: "YkMjPoSoSyOTrLyf76Mzqt" },
        function() {}
      );
      assert.equal(reqId, "YkMjPoSoSyOTrLyf76Mzqt");
    });
  });

  describe('extractStreamId()', function() {
    var ObjectDecorator = rewire(lab.getDevebotModule('backbone/object-decorator'));
    var extractStreamId = ObjectDecorator.__get__('extractStreamId');
    var appInfo = {
      name: 'example',
      version: '0.1.1',
      framework: {
        name: 'devebot',
        version: '0.2.8'
      }
    }

    it('return undefined if decorator configuration is not enable', function() {
      assert.isUndefined(extractStreamId({enabled: false}, appInfo, 'YkMjPoSoSyOTrLyf76Mzqt'));
    });

    it('streamIdExpression will generate a correct streamId', function() {
      assert.equal(extractStreamId({
        streamIdExpression: '#{name}@#{version}'
      }, appInfo, 'YkMjPoSoSyOTrLyf76Mzqt'), 'example@0.1.1');
    });

    it('should keep safety with an unsafe streamIdExtractor', function() {
      var streamId;
      assert.doesNotThrow(function() {
        streamId = extractStreamId({
          streamIdExtractor: function() {
            var obj;
            return obj.streamId;
          }
        }, appInfo, 'YkMjPoSoSyOTrLyf76Mzqt');
      }, Error);
      assert.equal(streamId, 'YkMjPoSoSyOTrLyf76Mzqt');
    });

    it('unstring returned value of streamIdExtractor will be skipped', function() {
      assert.equal(extractStreamId({
        streamIdExtractor: function() {
          return true
        }
      }, appInfo, 'YkMjPoSoSyOTrLyf76Mzqt'), 'YkMjPoSoSyOTrLyf76Mzqt');
      assert.equal(extractStreamId({
        streamIdExtractor: function() {
          return 1024
        }
      }, appInfo, 'YkMjPoSoSyOTrLyf76Mzqt'), 'YkMjPoSoSyOTrLyf76Mzqt');
      assert.equal(extractStreamId({
        streamIdExtractor: function() {
          return {}
        }
      }, appInfo, 'YkMjPoSoSyOTrLyf76Mzqt'), 'YkMjPoSoSyOTrLyf76Mzqt');
      assert.equal(extractStreamId({
        streamIdExtractor: function() {
          return null
        }
      }, appInfo, 'YkMjPoSoSyOTrLyf76Mzqt'), 'YkMjPoSoSyOTrLyf76Mzqt');
      assert.equal(extractStreamId({
        streamIdExtractor: function() {
          return undefined
        }
      }, appInfo, 'YkMjPoSoSyOTrLyf76Mzqt'), 'YkMjPoSoSyOTrLyf76Mzqt');
    });

    it('streamIdExtractor will generate a correct streamId', function() {
      assert.equal(extractStreamId({
        streamIdExtractor: function(appInfo, instanceId) {
          return instanceId + '@' + appInfo.version
        }
      }, appInfo, 'YkMjPoSoSyOTrLyf76Mzqt'), 'YkMjPoSoSyOTrLyf76Mzqt@0.1.1');
    });
  });

  after(function() {
    LogTracer.clearInterceptors();
    envmask.reset();
  });
});
