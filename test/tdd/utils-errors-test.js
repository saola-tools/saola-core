'use strict';

var lab = require('../index');
var Devebot = lab.getDevebot();
var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');
var loader = Devebot.require('loader');
var assert = require('chai').assert;
var expect = require('chai').expect;
var path = require('path');
var util = require('util');
var chores = require(lab.getDevebotModule('utils/chores'));
var errors = require(lab.getDevebotModule('utils/errors'));
var envmask = require('envmask').instance;
var LogAdapter = require('logolite').LogAdapter;
var LogTracer = require('logolite').LogTracer;

var debugx = Devebot.require('pinbug')('tdd:devebot:utils:errors');

describe('tdd:devebot:utils:errors', function() {

  describe('stackTraceLimit', function() {
    it('stackTraceLimit effects the stackTrace output', function() {
      try {
        var SomeError = errors.createConstructor('SomeError');
        var limit = 3;
        var message = util.format('stack must have %s lines', limit);
        errors.stackTraceLimit = limit;
        throw new SomeError(message);
      } catch (err) {
        var output = err.stack.split('\n');
        assert.lengthOf(output, limit + 1);
        assert.equal(output[0], 'SomeError: ' + message);
        return Promise.resolve();
      }
      assert.isNotOk(true, 'error should be thrown and catched');
    });
  });

  describe('createConstructor()', function() {
    var MyError = errors.createConstructor('MyError');

    it('createConstructor() should create an error constructor correctly', function() {
      var anyError = new MyError();
      assert.isTrue(errors.isDerivative(MyError));
      assert.isTrue(errors.isDescendant(anyError));
      assert.instanceOf(anyError, MyError);
      assert.equal(anyError.name, "MyError");
    });

    it('createConstructor() should create independent new error constructor', function() {
      var AnotherError = errors.createConstructor('MyError');
      var anotherError = new AnotherError();
      assert.isTrue(errors.isDerivative(AnotherError));
      assert.notEqual(AnotherError, MyError);
      assert.isTrue(errors.isDescendant(anotherError));
      assert.notInstanceOf(anotherError, MyError);
    });

    it('[code], [message], [payload] properties of empty error object must be undefined', function() {
      var emptyError = new MyError();
      assert.isUndefined(emptyError.code);
      assert.isUndefined(emptyError.message);
      assert.isUndefined(emptyError.payload);
    });

    it('[message] properties of error object must be set properly', function() {
      var messageError = new MyError("This is a string");
      assert.isUndefined(messageError.code);
      assert.equal(messageError.message, "This is a string");
      assert.isUndefined(messageError.payload);
    });

    it('[code] properties of error object must be set properly', function() {
      var codeError = new MyError(1024);
      assert.isUndefined(codeError.message);
      assert.equal(codeError.code, 1024);
      assert.isUndefined(codeError.payload);
    });

    it('[payload] properties of error object must be set properly', function() {
      var payloadError = new MyError({
        field1: "This is an object",
        field2: true,
        field3: 3.14159
      });
      assert.isUndefined(payloadError.message);
      assert.isUndefined(payloadError.code);
      assert.deepEqual(payloadError.payload, {
        field1: "This is an object",
        field2: true,
        field3: 3.14159
      });
    });

    it('[code], [message], [payload] properties can be provided together', function() {
      var fullError = new MyError("This is complete arguments error", -1, {
        host: '0.0.0.0',
        port: 1024
      });
      assert.equal(fullError.code, -1);
      assert.equal(fullError.message, "This is complete arguments error");
      assert.deepEqual(fullError.payload, {
        host: '0.0.0.0',
        port: 1024
      });
    });
  });

});
