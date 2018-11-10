'use strict';

var lab = require('../index');
var Devebot = lab.getDevebot();
var lodash = Devebot.require('lodash');
var chores = Devebot.require('chores');
var debugx = Devebot.require('pinbug')('tdd:devebot:core:object-decorator');
var assert = require('chai').assert;
var path = require('path');
var util = require('util');
var LogConfig = require('logolite').LogConfig;
var LogTracer = require('logolite').LogTracer;
var envmask = require('envmask').instance;
var sinon = require('sinon');

describe('tdd:devebot:core:object-decorator', function() {
  this.timeout(lab.getDefaultTimeout());

  before(function() {
    envmask.setup({
      LOGOLITE_ALWAYS_ENABLED: 'all',
      LOGOLITE_ALWAYS_MUTED: 'all'
    });
    LogConfig.reset();
  });

  describe('wrapMethod()', function() {
    it('should wrap a method without textures correctly', function() {
      var objectDecorator = lab.createObjectDecorator('fullapp', {
        textureNames: ['default'],
        textureConfig: {}
      });
      var originalMethod = sinon.stub();
      var wrappedMethod = objectDecorator.wrapMethod(originalMethod);
      var result = wrappedMethod({ msg: 'Hello world' }, { reqId: LogConfig.getLogID() });
      assert.equal(originalMethod.callCount, 1);
      assert.equal(originalMethod.firstCall.args.length, 2);
      assert.deepEqual(originalMethod.firstCall.args[0], { msg: 'Hello world' });
      assert.hasAllKeys(originalMethod.firstCall.args[1], ['reqId']);
    });
  })

  describe('wrapMethodsOf()', function() {
    it('should wrap all of public methods of a bean', function() {
      var objectDecorator = lab.createObjectDecorator('fullapp', {
        textureNames: ['default'],
        textureConfig: {}
      });
      
      var originalBean = {
        method1: sinon.stub(),
        method2: sinon.stub()
      }
      
      var wrappedBean = objectDecorator.wrapMethodsOf(lodash.clone(originalBean), {
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

  after(function() {
    LogTracer.clearInterceptors();
    envmask.reset();
  });
});
