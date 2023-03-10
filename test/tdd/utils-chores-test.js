"use strict";

const path = require("path");
const util = require("util");

const lab = require("../index");
const FRWK = lab.getFramework();
const chores = FRWK.require("chores");
const lodash = FRWK.require("lodash");

const { assert, rewire } = require("liberica");

const constx = require(lab.getFrameworkModule("utils/constx"));
const FRAMEWORK_NAMESPACE = constx.FRAMEWORK.NAMESPACE;
const FRAMEWORK_NAMESPACE_UCASE = lodash.toUpper(FRAMEWORK_NAMESPACE);
const FRAMEWORK_PACKAGE_NAME = constx.FRAMEWORK.PACKAGE_NAME;
const FILE_JS_FILTER_PATTERN = constx.FILE.JS_FILTER_PATTERN;

describe("tdd:lib:utils:chores", function() {
  describe("filesFilterPattern", function() {
    const filesFilter = FILE_JS_FILTER_PATTERN;
    const filesFilterRegExp = new RegExp(filesFilter);
    //
    it(util.format("Filter a list of absolute file paths by the regexp pattern '%s'", filesFilter), function() {
      const source = [
        "config/profile.js",
        "config/profile_production.js",
        "config/.keepme",
        "config/.metadata",
        "config/sandbox.js",
        "config/sandbox_mock.js",
      ];
      //
      const expected = [
        "config/profile.js",
        "config/profile_production.js",
        "config/sandbox.js",
        "config/sandbox_mock.js"
      ];
      //
      const filtered = lodash.filter(source, function(filename) {
        return filesFilterRegExp.test(filename);
      });
      false && console.info("Filter by '%s': %s", filesFilter, JSON.stringify(filtered, null, 2));
      //
      assert.sameMembers(filtered, expected);
    });
  });

  describe("filterFiles()", function() {
    const choresModule = rewire(lab.getFrameworkModule("utils/chores"));
    it("Files with .js extension must be filtered by the constx.FILE.JS_FILTER_PATTERN correctly", function() {
      const source = [
        "config",
        "config/profile.js",
        "config/profile_production.js",
        "config/.keepme",
        "config/.metadata",
        "config/sandbox.js",
        "config/sandbox_mock.js",
        "data",
        "data/examplejs",
        "data/sample.json",
        "README.adoc",
      ];
      //
      const filterPatterns = [ /.*\.js$/, FILE_JS_FILTER_PATTERN ];
      //
      const expected = [
        "config/profile.js",
        "config/profile_production.js",
        "config/sandbox.js",
        "config/sandbox_mock.js"
      ];
      //
      const mockspace = choresModule.__with__({
        readDir: function(dir) {
          return source;
        },
        isFile: function(filepath) {
          if (["config", "data"].includes(filepath)) {
            return false;
          }
          return true;
        },
      });
      //
      return mockspace(function() {
        return Promise.resolve().then(function() {
          for (let filter of filterPatterns) {
            const selected = choresModule.filterFiles("/", filter);
            false && console.info(JSON.stringify(selected, null, 2));
            assert.sameMembers(selected, expected);
          }
        });
      });
    });
  });

  describe("loadServiceByNames()", function() {
    let serviceFolder = lab.getLibHome("testcode/services");
    let serviceNames = ["service1", "service2"];
    it("should load service modules by names", function() {
      let serviceMap = {};
      let result = chores.loadServiceByNames(serviceMap, serviceFolder, serviceNames);
      assert.equal(result, serviceMap);
      assert.sameMembers(lodash.keys(serviceMap), serviceNames);
      let totalConstructors = lodash.reduce(lodash.values(serviceMap), function(sum, f) {
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
      let file = path.join(lab.getLibHome("plugin1"), "lib/services/plugin1-service.js");
      assert.equal(chores.getBlockRef(file), chores.toFullname(FRAMEWORK_PACKAGE_NAME, "plugin1Service"));
      assert.equal(chores.getBlockRef(file, "mymodule"), chores.toFullname("mymodule", "plugin1Service"));
      assert.equal(chores.getBlockRef(file, [ "mymodule" ]), chores.toFullname("mymodule", "plugin1Service"));
      assert.equal(chores.getBlockRef(file, [ "part1", "part2" ]), chores.toFullname("part1", "part2", "plugin1Service"));
    });
  });

  describe("extractCodeByPattern()", function() {
    it("should extract code by pattern from name correctly", function() {
      const BRIDGE_NAME_PATTERNS = [
        /^example-co-([a-z][a-z0-9\-]*[a-z0-9])$/g,
        /^([a-z][a-z0-9\-]*[a-z0-9])$/g
      ];
      assert.deepEqual(chores.extractCodeByPattern(BRIDGE_NAME_PATTERNS, "hello-world"), { i: 1, code: "hello-world" });
      assert.deepEqual(chores.extractCodeByPattern(BRIDGE_NAME_PATTERNS, "hello_world"), { i: -1, code: "hello_world" });
      assert.deepEqual(chores.extractCodeByPattern(BRIDGE_NAME_PATTERNS, "example-co"), { i: 1, code: "example-co" });
      assert.deepEqual(chores.extractCodeByPattern(BRIDGE_NAME_PATTERNS, "example-co-"), { i: -1, code: "example-co-" });
      assert.deepEqual(chores.extractCodeByPattern(BRIDGE_NAME_PATTERNS, "example-co-hello-world"), { i: 0, code: "hello-world" });
      assert.deepEqual(chores.extractCodeByPattern(BRIDGE_NAME_PATTERNS, "example-co-hello_world"), { i: -1, code: "example-co-hello_world" });
      assert.deepEqual(chores.extractCodeByPattern(BRIDGE_NAME_PATTERNS, "example-co-top-s3cr3t"), { i: 0, code: "top-s3cr3t" });
      assert.deepEqual(chores.extractCodeByPattern(BRIDGE_NAME_PATTERNS, "example-co-your-5ecret"), { i: 0, code: "your-5ecret" });
    });
  });

  describe("transformBeanName()", function() {
    it("should transform by default pattern correctly", function() {
      let someObj = { name: "object" };
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
      let obj = { a: { b: { c: 1000 }, f: function(x) { return x; } } };
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
      let range = {};
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

  describe("renameJsonFields()", function() {
    const mappings = {
      "_id": "id",
      "profile.phone": "profile.phoneNumber",
      "form.e-mail": "profile.email",
    };
    //
    it("skip to transform a non plain object", function () {
      const func = function() {};
      assert.isNull(chores.renameJsonFields(null, mappings));
      assert.equal(chores.renameJsonFields("hello", mappings), "hello");
      assert.equal(chores.renameJsonFields(func, mappings), func);
    });
    //
    it("do nothing when no field matching with the mappings", function () {
      const data = {
        firstName: "John",
        lastName: "Doe"
      };
      assert.deepEqual(chores.renameJsonFields(data, mappings), data);
    });
    //
    it("renames the fields which matches with the mappings", function () {
      const data = {
        "_id": "18EA8B71-FD96-4DC7-89AB-DD58C6A019DA",
        "firstName": "John",
        "lastName": "Doe",
        "profile": {
          "phone": "+84982508124",
          "phoneNumber": "911"
        },
        "form": {
          "e-mail": "john.doe@example.com",
          "note": "registration form"
        },
      };
      //
      const expected = {
        "id": "18EA8B71-FD96-4DC7-89AB-DD58C6A019DA",
        "firstName": "John",
        "lastName": "Doe",
        "profile": {
          "phoneNumber": "+84982508124",
          "email": "john.doe@example.com"
        },
        "form": {
          "note": "registration form"
        }
      };
      //
      const result = chores.renameJsonFields(data, mappings);
      false && console.info(JSON.stringify(result, null, 2));
      //
      assert.deepEqual(result, expected);
    });
  });

  describe("isSilentForced()", function() {
    it("FORCING_SILENT=framework,webserver", function() {
      chores.setEnvironments({
        [FRAMEWORK_NAMESPACE_UCASE + "_FORCING_SILENT"]: "framework,webserver"
      });
      assert.isTrue(chores.isSilentForced("framework"));
      assert.isTrue(chores.isSilentForced(["something", "framework"]));
      assert.isTrue(chores.isSilentForced(["framework", "webserver"]));
      assert.isTrue(chores.isSilentForced("webserver"));
      //
      assert.isFalse(chores.isSilentForced("something"));
      assert.isFalse(chores.isSilentForced("restfront"));
    });
  });

  describe("isVerboseForced()", function() {
    it("FORCING_SILENT=framework,webserver", function() {
      chores.setEnvironments({
        [FRAMEWORK_NAMESPACE_UCASE + "_FORCING_SILENT"]: "framework,webserver"
      });
      assert.isFalse(chores.isVerboseForced("framework"));
      assert.isFalse(chores.isVerboseForced(["something", "framework"]));
      assert.isFalse(chores.isVerboseForced(["framework", "webserver"]));
      assert.isFalse(chores.isVerboseForced("webserver"));
      //
      assert.isTrue(chores.isVerboseForced("something"));
      assert.isTrue(chores.isVerboseForced("restfront"));
    });
    //
    afterEach(function() {
      chores.clearCache();
    });
  });
});
