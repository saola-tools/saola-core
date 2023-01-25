"use strict";

var lab = require("../index");
var Devebot = lab.getDevebot();
var Promise = Devebot.require("bluebird");
var Injektor = Devebot.require("injektor");
var chores = Devebot.require("chores");
var lodash = Devebot.require("lodash");
var loader = Devebot.require("loader");
var errors = Devebot.require("errors");
var assert = require("chai").assert;
var LogConfig = Devebot.require("logolite").LogConfig;
var LogTracer = Devebot.require("logolite").LogTracer;
var envcloak = require("envcloak").instance;
var sinon = require("sinon");

var constx = require("../../lib/utils/constx");

describe("tdd:lib:core:sandbox-manager", function() {
  this.timeout(lab.getDefaultTimeout());

  var issueInspector = lab.getIssueInspector();

  before(function() {
    envcloak.setup({
      NODE_ENV: "test",
      LOGOLITE_FULL_LOG_MODE: "false",
      LOGOLITE_ALWAYS_ENABLED: "all",
      LOGOLITE_ALWAYS_MUTED: "all"
    });
    LogConfig.reset();
    issueInspector.reset();
  });

  it("getBridgeDialectNames() - retrieve bridge dialect names correctly", function() {
    var sandboxManager = lab.createSandboxManager("fullapp");
    if (!chores.isUpgradeSupported("bridge-full-ref")) {
      assert.deepEqual(sandboxManager.getBridgeDialectNames(), [
        "bridge1/anyname1a",
        "bridge1/anyname1b",
        "bridge2/anyname2a",
        "bridge2/anyname2b",
        "bridge2/anyname2c",
        "bridge1/anyname1c"
      ]);
      return;
    }
    assert.deepEqual(sandboxManager.getBridgeDialectNames(), [
      chores.toFullname("application", "bridge1#anyname1z"),
      chores.toFullname("plugin1", "bridge1#anyname1a"),
      chores.toFullname("plugin2", "bridge1#anyname1b"),
      chores.toFullname("plugin2", "bridge1#anyname1c"),
      chores.toFullname("application", "bridge2#anyname2y"),
      chores.toFullname("application", "bridge2#anyname2z"),
      chores.toFullname("plugin1", "bridge2#anyname2a"),
      chores.toFullname("plugin1", "bridge2#anyname2c"),
      chores.toFullname("plugin2", "bridge2#anyname2b"),
      chores.toFullname("application", "connector1#wrapper"),
      chores.toFullname("application", "connector2#wrapper")
    ]);
  });

  it("getPluginServiceNames() - retrieve plugin service names correctly", function() {
    var sandboxManager = lab.createSandboxManager("fullapp");
    assert.deepEqual(sandboxManager.getPluginServiceNames(), [
      chores.toFullname("application", "mainService"),
      chores.toFullname("sub-plugin1", "sublibService"),
      chores.toFullname("sub-plugin2", "sublibService"),
      chores.toFullname("plugin1", "plugin1Service"),
      chores.toFullname("plugin2", "plugin2Service"),
      chores.toFullname("plugin3", "plugin3Service")
    ]);
  });

  it("getPluginTriggerNames() - retrieve plugin trigger names correctly", function() {
    var sandboxManager = lab.createSandboxManager("fullapp");
    assert.deepEqual(sandboxManager.getPluginTriggerNames(), [
      chores.toFullname("application", "mainTrigger"),
      chores.toFullname("sub-plugin1", "sublibTrigger"),
      chores.toFullname("sub-plugin2", "sublibTrigger"),
      chores.toFullname("plugin1", "plugin1Trigger"),
      chores.toFullname("plugin2", "plugin2Trigger"),
      chores.toFullname("plugin3", "plugin3Trigger")
    ]);
  });

  it("getSandboxService() - retrieve the unique named service with or without suggested scope", function() {
    var sandboxManager = lab.createSandboxManager("fullapp");

    var plugin2Service0 = sandboxManager.getSandboxService("plugin2Service");
    assert.isNotNull(plugin2Service0);

    var plugin2Service1 = sandboxManager.getSandboxService("plugin2Service", {
      scope: "plugin1"
    });
    assert.isNotNull(plugin2Service1);

    var plugin2Service2 = sandboxManager.getSandboxService("plugin2Service", {
      scope: "plugin2"
    });
    assert.isNotNull(plugin2Service2);

    assert.equal(plugin2Service0, plugin2Service1);
    assert.equal(plugin2Service1, plugin2Service2);
  });

  it("getSandboxService() - retrieve the same named services from different plugins", function() {
    var sandboxManager = lab.createSandboxManager("fullapp");

    assert.throws(function() {
      var sublibService = sandboxManager.getSandboxService("sublibService");
    }, Injektor.errors.DuplicatedRelativeNameError, "name [sublibService] is duplicated");

    var sublibService1 = sandboxManager.getSandboxService("sublibService", {
      scope: "sub-plugin1"
    });
    false && console.log(sublibService1.getConfig());
    assert.isNotNull(sublibService1);
    assert.deepEqual(sublibService1.getConfig(), { host: "localhost", port: 17721 });

    var sublibService2 = sandboxManager.getSandboxService("sublibService", {
      scope: "sub-plugin2"
    });
    false && console.log(sublibService2.getConfig());
    assert.isNotNull(sublibService2);
    assert.deepEqual(sublibService2.getConfig(), { host: "localhost", port: 17722 });
  });

  describe("logging-interception", function() {
    var loggingStore = {};

    before(function() {
      LogTracer.setupDefaultInterceptors([{
        accumulator: loggingStore,
        mappings: [{
          allTags: [ chores.toFullname(constx.FRAMEWORK.NAME, "sandboxManager"), "excluded-internal-services" ],
          storeTo: "list"
        }]
      }]);
    });

    beforeEach(function() {
      LogTracer.reset().empty(loggingStore);
    });

    it("excludedServices should be defined properly", function() {
      var sandboxManager = lab.createSandboxManager("fullapp");
      var excluded = lodash.get(loggingStore, "list.0.excludedServices", {});
      if (true) {
        assert.deepEqual(excluded, [
          chores.toFullname(constx.FRAMEWORK.NAME, "sandboxRegistry")
        ]);
      } else {
        console.log(JSON.stringify(loggingStore, null, 2));
      }
    });

    after(function() {
      LogTracer.clearInterceptors();
    });
  });

  describe("SandboxRegistry", function() {
    var SandboxManager = lab.acquireDevebotModule("backbone/sandbox-manager");
    var SandboxRegistry = SandboxManager.__get__("SandboxRegistry");

    function SampleService () {}
    var serviceName = "sampleService";
    var context = { scope: "testing" };
    var serviceFullname = [context.scope, serviceName].join(chores.getSeparator());

    before(function() {
    });

    it("make sure that deprecated methods are available", function() {
      var injektor = new Injektor({ separator: chores.getSeparator() });
      var sandboxRegistry = new SandboxRegistry({ injektor });
      assert.isFunction(sandboxRegistry.lookupService);
    });

    it("lookup() - retrieves beans properly", function() {
      var bean1 = {}; var bean2 = {};
      var injektor = new Injektor({ separator: chores.getSeparator() });
      injektor.registerObject("bean1", bean1);
      injektor.registerObject("bean2", bean2, context);

      var sandboxRegistry = new SandboxRegistry({ injektor });

      assert.isNull(sandboxRegistry.lookup("bean0"));
      assert.isNull(sandboxRegistry.lookup("testing/bean1"));
      assert.deepEqual(sandboxRegistry.lookup("bean1"), bean1);
      assert.deepEqual(sandboxRegistry.lookup("bean2"), bean2);
      assert.deepEqual(sandboxRegistry.lookup("testing/bean2"), bean2);
    });

    it("lookup() - isExcluded() is supported", function() {
      var context = { scope: constx.FRAMEWORK.NAME };
      var bean1 = {}; var bean2 = {}; var bean3 = {};
      var injektor = new Injektor({ separator: chores.getSeparator() });
      injektor.registerObject("devebot-co-sample", bean1);
      injektor.registerObject("example", bean2, context);
      injektor.registerObject("testing/example", bean3);
      var isExcluded = function(beanFullName) {
        return (typeof beanFullName !== "string") || (beanFullName.match(/devebot/));
      };
      var sandboxRegistry = new SandboxRegistry({ injektor, isExcluded });
      assert.isNull(sandboxRegistry.lookup("devebot-co-sample"));
      assert.isNull(sandboxRegistry.lookup("example"));
      assert.isNull(sandboxRegistry.lookup(chores.toFullname(constx.FRAMEWORK.NAME, "example")));
      assert.deepEqual(sandboxRegistry.lookup("testing/example"), bean3);
    });

    it("lookup() - excludedServices list is supported", function() {
      var context = { scope: constx.FRAMEWORK.NAME };
      var bean1 = {}; var bean2 = {}; var bean3 = {};
      var injektor = new Injektor({ separator: chores.getSeparator() });
      injektor.registerObject("devebot-co-sample", bean1);
      injektor.registerObject("example", bean2, context);
      injektor.registerObject("testing/example", bean3);
      var excludedServices = [ chores.toFullname(constx.FRAMEWORK.NAME, "example") ];
      var sandboxRegistry = new SandboxRegistry({ injektor, excludedServices });
      assert.deepEqual(sandboxRegistry.lookup("devebot-co-sample"), bean1);
      assert.isNull(sandboxRegistry.lookup("example"));
      assert.isNull(sandboxRegistry.lookup(chores.toFullname(constx.FRAMEWORK.NAME, "example")));
      assert.deepEqual(sandboxRegistry.lookup("testing/example"), bean3);
    });

    it("defineService() - RestrictedDevebotError", function() {
      var context = { scope: constx.FRAMEWORK.NAME };

      var injektor = new Injektor({ separator: chores.getSeparator() });
      var _parseName = sinon.spy(injektor, "parseName");
      var _resolveName = sinon.spy(injektor, "resolveName");
      var _defineService = sinon.spy(injektor, "defineService");

      var sandboxRegistry = new SandboxRegistry({ injektor });

      assert.throws(function() {
        sandboxRegistry.defineService(serviceName, SampleService, context);
      }, errors.assertConstructor("RestrictedDevebotError"));

      assert.isTrue(_parseName.calledOnce);
      assert.isTrue(_resolveName.notCalled);
      assert.isTrue(_defineService.notCalled);
    });

    it("defineService() - DuplicatedDevebotError", function() {
      var injektor = new Injektor({ separator: chores.getSeparator() });
      injektor.registerObject(serviceFullname, {});

      var _parseName = sinon.spy(injektor, "parseName");
      var _resolveName = sinon.spy(injektor, "resolveName");
      var _defineService = sinon.spy(injektor, "defineService");

      var sandboxRegistry = new SandboxRegistry({ injektor });

      assert.throws(function() {
        sandboxRegistry.defineService(serviceName, SampleService, context);
      }, errors.assertConstructor("DuplicatedDevebotError"));

      assert.isTrue(_parseName.calledOnce);
      assert.isTrue(_resolveName.calledOnce);
      assert.isTrue(_defineService.notCalled);
    });

    it("defineService() - [scope in context]", function() {
      var injektor = new Injektor({ separator: chores.getSeparator() });
      var _parseName = sinon.spy(injektor, "parseName");
      var _resolveName = sinon.spy(injektor, "resolveName");
      var _defineService = sinon.spy(injektor, "defineService");

      var sandboxRegistry = new SandboxRegistry({ injektor });

      sandboxRegistry.defineService(serviceName, SampleService, context);

      assert.isTrue(_parseName.calledOnce);
      assert.equal(_parseName.firstCall.args[0], serviceName);
      assert.deepEqual(_parseName.firstCall.args[1], context);

      assert.isTrue(_resolveName.calledOnce);
      assert.equal(_resolveName.firstCall.args[0], serviceName);
      assert.equal(lodash.get(_resolveName.firstCall.args, [1, "scope"]), context.scope);
      assert.isArray(lodash.get(_resolveName.firstCall.args, [1, "exceptions"]));

      assert.isTrue(_defineService.calledOnce);
      assert.equal(_defineService.firstCall.args[0], serviceName);
      assert.equal(_defineService.firstCall.args[1], SampleService);
      assert.deepEqual(_defineService.firstCall.args[2], context);
    });

    it("defineService() - [name contains scope]", function() {
      var injektor = new Injektor({ separator: chores.getSeparator() });
      var _parseName = sinon.spy(injektor, "parseName");
      var _resolveName = sinon.spy(injektor, "resolveName");
      var _defineService = sinon.spy(injektor, "defineService");

      var sandboxRegistry = new SandboxRegistry({ injektor });

      sandboxRegistry.defineService(serviceFullname, SampleService);

      assert.isTrue(_parseName.calledOnce);
      assert.equal(_parseName.firstCall.args[0], serviceFullname);
      assert.deepEqual(_parseName.firstCall.args[1], {});

      assert.isTrue(_resolveName.calledOnce);
      assert.equal(_resolveName.firstCall.args[0], serviceFullname);
      assert.isUndefined(lodash.get(_resolveName.firstCall.args, [1, "scope"]));
      assert.isArray(lodash.get(_resolveName.firstCall.args, [1, "exceptions"]));

      assert.isTrue(_defineService.calledOnce);
      assert.equal(_defineService.firstCall.args[0], serviceFullname);
      assert.equal(_defineService.firstCall.args[1], SampleService);
      assert.deepEqual(_defineService.firstCall.args[2], undefined);
    });
  });

  after(function() {
    envcloak.reset();
    issueInspector.reset();
  });
});
