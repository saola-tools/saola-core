"use strict";

const lab = require("../index");
const Devebot = lab.getFramework();
const Promise = Devebot.require("bluebird");
const assert = require("chai").assert;
const util = require("util");
const errors = require(lab.getFrameworkModule("utils/errors"));

describe("tdd:lib:utils:errors", function() {
  describe("stackTraceLimit", function() {
    it("stackTraceLimit effects the stackTrace output", function() {
      const limit = 3;
      const message = util.format("stack must have %s lines", limit);
      try {
        const SomeError = errors.createConstructor("SomeError");
        errors.stackTraceLimit = limit;
        throw new SomeError(message);
      } catch (err) {
        const output = err.stack.split("\n");
        assert.lengthOf(output, limit + 1);
        assert.equal(output[0], "SomeError: " + message);
        return Promise.resolve();
      }
      assert.isNotOk(true, "error should be thrown and catched");
    });
  });

  describe("assertConstructor()", function() {
    it("assertConstructor() create only one constructor for each Error", function() {
      assert.equal(errors.assertConstructor("Error1"), errors.assertConstructor("Error1"));
      assert.notEqual(errors.assertConstructor("Error2"), errors.assertConstructor("Error1"));
      assert.equal(errors.assertConstructor("Error2"), errors.assertConstructor("Error2"));
    });
  });

  describe("createConstructor()", function() {
    const MyError = errors.createConstructor("MyError");

    it("createConstructor() should create an error constructor correctly", function() {
      const anyError = new MyError();
      assert.isTrue(errors.isDerivative(MyError));
      assert.isTrue(errors.isDescendant(anyError));
      assert.instanceOf(anyError, MyError);
      assert.equal(anyError.name, "MyError");
    });

    it("createConstructor() should create independent new error constructor", function() {
      const AnotherError = errors.createConstructor("MyError");
      const anotherError = new AnotherError();
      assert.isTrue(errors.isDerivative(AnotherError));
      assert.notEqual(AnotherError, MyError);
      assert.isTrue(errors.isDescendant(anotherError));
      assert.notInstanceOf(anotherError, MyError);
    });

    it("[code], [message], [payload] properties of empty error object must be undefined", function() {
      const emptyError = new MyError();
      assert.isUndefined(emptyError.code);
      assert.isUndefined(emptyError.message);
      assert.isUndefined(emptyError.payload);
    });

    it("[message] properties of error object must be set properly", function() {
      const messageError = new MyError("This is a string");
      assert.isUndefined(messageError.code);
      assert.equal(messageError.message, "This is a string");
      assert.isUndefined(messageError.payload);
    });

    it("[code] properties of error object must be set properly", function() {
      const codeError = new MyError(1024);
      assert.isUndefined(codeError.message);
      assert.equal(codeError.code, 1024);
      assert.isUndefined(codeError.payload);
    });

    it("[payload] properties of error object must be set properly", function() {
      const payloadError = new MyError({
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

    it("[code], [message], [payload] properties can be provided together", function() {
      const fullError = new MyError("This is complete arguments error", -1, {
        host: "0.0.0.0",
        port: 1024
      });
      assert.equal(fullError.code, -1);
      assert.equal(fullError.message, "This is complete arguments error");
      assert.deepEqual(fullError.payload, {
        host: "0.0.0.0",
        port: 1024
      });
    });
  });
});
