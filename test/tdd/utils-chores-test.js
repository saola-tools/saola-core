"use strict";

var lab = require("../index");
var Devebot = lab.getDevebot();
var chores = Devebot.require("chores");
var lodash = Devebot.require("lodash");
var assert = require("chai").assert;
var path = require("path");

var constx = require("../../lib/utils/constx");

describe("tdd:lib:utils:chores", function() {
  describe("loadServiceByNames()", function() {
    var serviceFolder = lab.getLibHome("testcode/services");
    var serviceNames = ["service1", "service2"];
    it("should load service modules by names", function() {
      var serviceMap = {};
      var result = chores.loadServiceByNames(serviceMap, serviceFolder, serviceNames);
      assert.equal(result, serviceMap);
      assert.sameMembers(lodash.keys(serviceMap), serviceNames);
      var totalConstructors = lodash.reduce(lodash.values(serviceMap), function(sum, f) {
        return lodash.isFunction(f) ? (sum + 1) : sum;
      }, 0);
      assert.equal(totalConstructors, serviceNames.length);
    });
  });

  describe("String manipulation", function() {
    it("stringKebabCase() converts normal string to kebab-case string", function() {
      assert.equal(chores.stringKebabCase(null), null);
      assert.equal(chores.stringKebabCase(""), "");
      assert.equal(chores.stringKebabCase("Application"), "application");
      assert.equal(chores.stringKebabCase("HELLO WORLD"), "hello-world");
      assert.equal(chores.stringKebabCase("Simple demo Application"), "simple-demo-application");
      assert.equal(chores.stringKebabCase("more  than   words"), "more-than-words");
    });

    it("stringLabelCase() converts normal string to label-case string", function() {
      assert.equal(chores.stringLabelCase(null), null);
      assert.equal(chores.stringLabelCase(""), "");
      assert.equal(chores.stringLabelCase("Application"), "APPLICATION");
      assert.equal(chores.stringLabelCase("Hello  world"), "HELLO_WORLD");
      assert.equal(chores.stringLabelCase("user@example.com"), "USER_EXAMPLE_COM");
      assert.equal(chores.stringLabelCase("Underscore_with 123"), "UNDERSCORE_WITH_123");
    });

    it("stringCamelCase() converts normal string to camel-case string", function() {
      assert.equal(chores.stringCamelCase(null), null);
      assert.equal(chores.stringCamelCase(""), "");
      assert.equal(chores.stringCamelCase("application"), "application");
      assert.equal(chores.stringCamelCase("hello-world"), "helloWorld");
      assert.equal(chores.stringCamelCase("three-words-phrase"), "threeWordsPhrase");
    });
  });

  describe("getBlockRef()", function() {
    it("should generate blockRef correctly", function() {
      var file = path.join(lab.getLibHome("plugin1"), "lib/services/plugin1-service.js");
      assert.equal(chores.getBlockRef(file), chores.toFullname(constx.FRAMEWORK.NAME, "plugin1Service"));
      assert.equal(chores.getBlockRef(file, "mymodule"), chores.toFullname("mymodule", "plugin1Service"));
      assert.equal(chores.getBlockRef(file, [ "mymodule" ]), chores.toFullname("mymodule", "plugin1Service"));
      assert.equal(chores.getBlockRef(file, [ "part1", "part2" ]), chores.toFullname("part1", "part2", "plugin1Service"));
    });
  });

  describe("extractCodeByPattern()", function() {
    it("should extract code by pattern from name correctly", function() {
      const BRIDGE_NAME_PATTERNS = [
        /^devebot-co-([a-z][a-z0-9\-]*[a-z0-9])$/g,
        /^([a-z][a-z0-9\-]*[a-z0-9])$/g
      ];
      assert.deepEqual(chores.extractCodeByPattern(BRIDGE_NAME_PATTERNS, "hello-world"), { i: 1, code: "hello-world" });
      assert.deepEqual(chores.extractCodeByPattern(BRIDGE_NAME_PATTERNS, "hello_world"), { i: -1, code: "hello_world" });
      assert.deepEqual(chores.extractCodeByPattern(BRIDGE_NAME_PATTERNS, "devebot-co"), { i: 1, code: "devebot-co" });
      assert.deepEqual(chores.extractCodeByPattern(BRIDGE_NAME_PATTERNS, "devebot-co-"), { i: -1, code: "devebot-co-" });
      assert.deepEqual(chores.extractCodeByPattern(BRIDGE_NAME_PATTERNS, "devebot-co-hello-world"), { i: 0, code: "hello-world" });
      assert.deepEqual(chores.extractCodeByPattern(BRIDGE_NAME_PATTERNS, "devebot-co-hello_world"), { i: -1, code: "devebot-co-hello_world" });
      assert.deepEqual(chores.extractCodeByPattern(BRIDGE_NAME_PATTERNS, "devebot-co-top-s3cr3t"), { i: 0, code: "top-s3cr3t" });
      assert.deepEqual(chores.extractCodeByPattern(BRIDGE_NAME_PATTERNS, "devebot-co-your-5ecret"), { i: 0, code: "your-5ecret" });
    });
  });

  describe("transformBeanName()", function() {
    it("should transform by default pattern correctly", function() {
      var someObj = { name: "object" };
      assert.deepEqual(chores.transformBeanName(someObj),  someObj);
      assert.equal(chores.transformBeanName(1024),  1024);
      assert.equal(chores.transformBeanName(true),  true);
      assert.equal(chores.transformBeanName(3.14159),  3.14159);
      assert.equal(chores.transformBeanName("@org/app:serviceName#bridgeName"),  "@org/app:serviceName#bridgeName");
      assert.equal(chores.transformBeanName("@org/app/serviceName#bridgeName"),  "@org/app:serviceName#bridgeName");
      assert.equal(chores.transformBeanName("oldPackageName/serviceName"),  "oldPackageName:serviceName");
    });
  });

  describe("deepFreeze()", function() {
    it("should prevent assign value to freezed fields", function() {
      var obj = { a: { b: { c: 1000 }, f: function(x) { return x; } } };
      chores.deepFreeze(obj);
      assert.throws(function() { obj.s = {}; }, TypeError);
      assert.throws(function() { delete obj.a; }, TypeError);
      assert.throws(function() { obj.a.f = function(x) { return 2*x; }; }, TypeError);
      assert.throws(function() { obj.a.f.prototype.z = function(x) { return 3*x; }; }, TypeError);
      assert.throws(function() { obj.a.b.c = 2000; }, TypeError);
      assert.throws(function() { obj.a.b.d = 1024; }, TypeError);
      assert.equal(obj.a.f(100), 100);
      assert.equal(obj.a.b.c, 1000);
      assert.isUndefined(obj.a.b.d);
    });
  });

  describe("extractObjectInfo()", function() {
    it("should extract javascript scalar types correctly", function() {
      assert.equal(chores.extractObjectInfo(undefined), "undefined");
      assert.equal(chores.extractObjectInfo("Hello world"), "string");
      assert.equal(chores.extractObjectInfo(""), "string");
      assert.equal(chores.extractObjectInfo(1024), "number");
      assert.equal(chores.extractObjectInfo(3.14), "number");
      assert.equal(chores.extractObjectInfo(Infinity), "number");
      assert.equal(chores.extractObjectInfo(NaN), "number");
      assert.equal(chores.extractObjectInfo(function area () {}), "function");
      assert.equal(chores.extractObjectInfo(true), "boolean");
      assert.equal(chores.extractObjectInfo(null), "null");
      assert.equal(chores.extractObjectInfo(Symbol()), "symbol");
      assert.equal(chores.extractObjectInfo(Symbol("string")), "symbol");
    });
    it("should extract javascript object types correctly", function() {
      assert.deepEqual(chores.extractObjectInfo([1, "a", true, null]),
          ["number", "string", "boolean", "null"]);
      assert.deepEqual(chores.extractObjectInfo([
        undefined, { n: 7, f: Math.floor, o: { x: 100 }, a: [ true ] }
      ]), [
        "undefined", { n: "number", f: "function", o: {}, a: [] }
      ]);
      assert.deepEqual(chores.extractObjectInfo([
        undefined, { n: 7, f: Math.floor, o: { x: 100 }, a: [ true ] }
      ], { level: 3 }), [
        "undefined", { n: "number", f: "function", o: {x: "number"}, a: ["boolean"] }
      ]);
    });
  });

  describe("argumentsToArray()", function() {
    it("should convert arguments to array correctly", function() {
      var range = {};
      function convert () {
        return chores.argumentsToArray(arguments, range.left, range.right);
      }
      range.left = undefined; range.right = undefined;
      assert.deepEqual(convert(), []);
      assert.deepEqual(convert("Hello"), ["Hello"]);
      assert.deepEqual(convert("Hello", 1, true, {}, []), ["Hello", 1, true, {}, []]);
      range.left = undefined; range.right = 0;
      assert.deepEqual(convert(), []);
      assert.deepEqual(convert("Hello"), ["Hello"]);
      assert.deepEqual(convert("Hello", 1, true, {}, []), ["Hello", 1, true, {}, []]);
      range.left = undefined; range.right = 1;
      assert.deepEqual(convert(), []);
      assert.deepEqual(convert("Hello"), []);
      assert.deepEqual(convert("Hello", 1, true, {}, []), ["Hello", 1, true, {}]);
      range.left = 0; range.right = undefined;
      assert.deepEqual(convert(), []);
      assert.deepEqual(convert("Hello"), ["Hello"]);
      assert.deepEqual(convert("Hello", 1, true, {}, []), ["Hello", 1, true, {}, []]);
      range.left = 1; range.right = undefined;
      assert.deepEqual(convert(), []);
      assert.deepEqual(convert("Hello"), []);
      assert.deepEqual(convert("Hello", 1, true, {}, []), [1, true, {}, []]);
      range.left = 2; range.right = 2;
      assert.deepEqual(convert("Hello", 1, true, {}, []), [true]);
      range.left = 3; range.right = 3;
      assert.deepEqual(convert("Hello", 1, true, {}, []), []);
    });
  });

  describe("isVersionLessThan()", function() {
    it("will return null with invalid version values", function () {
      assert.isNull(chores.isVersionLessThan("1.2.3", "a.b.c"));
      assert.isNull(chores.isVersionLessThan("a.b.c", "1.2.3"));
    });
    it("should compare versions correctly", function () {
      assert.isTrue(chores.isVersionLessThan("1.2.2", "1.2.3"));
      assert.isFalse(chores.isVersionLessThan("1.2.3", "1.2.3"));
      assert.isFalse(chores.isVersionLessThan("1.2.4", "1.2.3"));
    });
  });

  describe("isVersionSatisfied()", function() {
    it("version/version-mask is invalid", function () {
      assert.isFalse(chores.isVersionSatisfied(null, "~1.2.3"));
      assert.isFalse(chores.isVersionSatisfied("1.2.3", null));
      assert.isFalse(chores.isVersionSatisfied("1.2.3", "&1.2.x"));
    });
    it("version-mask is a string", function() {
      assert.isTrue(chores.isVersionSatisfied("1.2.3", "1.2.3"));
      assert.isFalse(chores.isVersionSatisfied("1.2.3", "1.2.4"));
      assert.isFalse(chores.isVersionSatisfied("1.2.3", "a.b.c"));

      assert.isTrue(chores.isVersionSatisfied("1.2.3", "^1.2.1"));
      assert.isTrue(chores.isVersionSatisfied("1.2.3", "^1.1.0"));
      assert.isFalse(chores.isVersionSatisfied("1.2.3", "^1.2.4"));
      assert.isFalse(chores.isVersionSatisfied("1.2.3", "^1.3.4"));
    });
    it("version-mask is an array", function() {
      assert.isFalse(chores.isVersionSatisfied("1.2.3", []));
      assert.isTrue(chores.isVersionSatisfied("1.2.3", ["1.2.3"]));
      assert.isTrue(chores.isVersionSatisfied("1.2.3", ["1.2.3", "1.2.4"]));
      assert.isTrue(chores.isVersionSatisfied("1.2.3", ["1.0.1", "1.2.x"]));
      assert.isFalse(chores.isVersionSatisfied("1.2.3", ["1.3", "2.3"]));
    });
  });

  describe("getFirstDefinedValue()", function() {
    it("return the first defined value in arguments", function () {
      assert.isUndefined(chores.getFirstDefinedValue(undefined, null, null, undefined));
      assert.equal(chores.getFirstDefinedValue(undefined, null, 1024, "hello"), 1024);
      assert.equal(chores.getFirstDefinedValue(null, undefined, "hello world"), "hello world");
      assert.equal(chores.getFirstDefinedValue(undefined, false, "abc.xyz"), false);
    });
  });

  describe("getVersionOf()", function() {
    it("return the valid versions of the packages", function () {
      assert.isString(chores.getVersionOf("bluebird"));
      assert.isString(chores.getVersionOf("lodash"));
      assert.isNull(chores.getVersionOf("version-not-found"));
    });
  });
});
