"use strict";

const lab = require("../index");
const FRWK = lab.getFramework();
const Injektor = FRWK.require("injektor");
const chores = FRWK.require("chores");
const lodash = FRWK.require("lodash");
const errors = FRWK.require("errors");
const LogConfig = FRWK.require("logolite").LogConfig;
const LogTracer = FRWK.require("logolite").LogTracer;
const envcloak = require("envcloak").instance;

const { assert, sinon } = require("liberica");

const constx = require(lab.getFrameworkModule("utils/constx"));
const FRAMEWORK_NAMESPACE = constx.FRAMEWORK.NAMESPACE;
const FRAMEWORK_NAMESPACE_UCASE = lodash.toUpper(FRAMEWORK_NAMESPACE);
const FRAMEWORK_PACKAGE_NAME = constx.FRAMEWORK.PACKAGE_NAME;

describe("tdd:lib:core:sandbox-manager", function() {
  this.timeout(lab.getDefaultTimeout());

  let issueInspector = lab.getIssueInspector();

  before(function() {
    envcloak.setup({
      LOGOLITE_FULL_LOG_MODE: "false",
      LOGOLITE_ALWAYS_ENABLED: "all",
      LOGOLITE_ALWAYS_MUTED: "all",
      [FRAMEWORK_NAMESPACE_UCASE + "_NODE_ENV"]: "test",
    });
    LogConfig.reset();
    issueInspector.reset();
  });

  after(function() {
    envcloak.reset();
    issueInspector.reset();
  });

  it("getBridgeDialectNames() - retrieve bridge dialect names correctly", function() {
    let sandboxManager = lab.createSandboxManager("fullapp");
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
    let sandboxManager = lab.createSandboxManager("fullapp");
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
    let sandboxManager = lab.createSandboxManager("fullapp");
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
    let sandboxManager = lab.createSandboxManager("fullapp");

    let plugin2Service0 = sandboxManager.getSandboxService("plugin2Service");
    assert.isNotNull(plugin2Service0);

    let plugin2Service1 = sandboxManager.getSandboxService("plugin2Service", {
      scope: "plugin1"
    });
    assert.isNotNull(plugin2Service1);

    let plugin2Service2 = sandboxManager.getSandboxService("plugin2Service", {
      scope: "plugin2"
    });
    assert.isNotNull(plugin2Service2);

    assert.equal(plugin2Service0, plugin2Service1);
    assert.equal(plugin2Service1, plugin2Service2);
  });

  it("getSandboxService() - retrieve the same named services from different plugins", function() {
    let sandboxManager = lab.createSandboxManager("fullapp");

    assert.throws(function() {
      let sublibService = sandboxManager.getSandboxService("sublibService");
    }, Injektor.errors.DuplicatedRelativeNameError, "name [sublibService] is duplicated");

    let sublibService1 = sandboxManager.getSandboxService("sublibService", {
      scope: "sub-plugin1"
    });
    false && console.info(sublibService1.getConfig());
    assert.isNotNull(sublibService1);
    assert.deepEqual(sublibService1.getConfig(), {
      "sub-plugin1/sublibService": { host: "localhost", port: 17721 }
    });

    let sublibService2 = sandboxManager.getSandboxService("sublibService", {
      scope: "sub-plugin2"
    });
    false && console.info(sublibService2.getConfig());
    assert.isNotNull(sublibService2);
    assert.deepEqual(sublibService2.getConfig(), {
      "sub-plugin2/sublibService": { host: "localhost", port: 17722 }
    });
  });

  describe("logging-interception", function() {
    let loggingStore = {};

    before(function() {
      LogTracer.setupDefaultInterceptors([{
        accumulator: loggingStore,
        mappings: [{
          allTags: [ chores.toFullname(FRAMEWORK_PACKAGE_NAME, "sandboxManager"), "excluded-internal-services" ],
          storeTo: "list"
        }]
      }]);
    });

    beforeEach(function() {
      LogTracer.reset().empty(loggingStore);
    });

    it("excludedServices should be defined properly", function() {
      let sandboxManager = lab.createSandboxManager("fullapp");
      let excluded = lodash.get(loggingStore, "list.0.excludedServices", {});
      if (true) {
        assert.deepEqual(excluded, [
          chores.toFullname(FRAMEWORK_PACKAGE_NAME, "sandboxRegistry")
        ]);
      } else {
        console.info(JSON.stringify(loggingStore, null, 2));
      }
    });

    after(function() {
      LogTracer.clearInterceptors();
    });
  });

  describe("SandboxRegistry", function() {
    let SandboxManager = lab.acquireFrameworkModule("backbone/sandbox-manager");
    let SandboxRegistry = SandboxManager.__get__("SandboxRegistry");

    function SampleService () {}
    let serviceName = "sampleService";
    let context = { scope: "testing" };
    let serviceFullname = [context.scope, serviceName].join(chores.getSeparator());

    before(function() {
    });

    it("make sure that deprecated methods are available", function() {
      let injektor = new Injektor({ separator: chores.getSeparator() });
      let sandboxRegistry = new SandboxRegistry({ injektor });
      assert.isFunction(sandboxRegistry.lookupService);
    });

    it("lookup() - retrieves beans properly", function() {
      let bean1 = {}; let bean2 = {};
      let injektor = new Injektor({ separator: chores.getSeparator() });
      injektor.registerObject("bean1", bean1);
      injektor.registerObject("bean2", bean2, context);

      let sandboxRegistry = new SandboxRegistry({ injektor });

      assert.isNull(sandboxRegistry.lookup("bean0"));
      assert.isNull(sandboxRegistry.lookup("testing/bean1"));
      assert.deepEqual(sandboxRegistry.lookup("bean1"), bean1);
      assert.deepEqual(sandboxRegistry.lookup("bean2"), bean2);
      assert.deepEqual(sandboxRegistry.lookup("testing/bean2"), bean2);
    });

    it("lookup() - isExcluded() is supported", function() {
      let context = { scope: FRAMEWORK_PACKAGE_NAME };
      let bean1 = {}; let bean2 = {}; let bean3 = {};
      let injektor = new Injektor({ separator: chores.getSeparator() });
      injektor.registerObject("example", bean1, context);
      injektor.registerObject(FRAMEWORK_NAMESPACE + "-co-sample", bean2);
      injektor.registerObject("testing/example", bean3);
      let isExcluded = function(beanFullName) {
        return (typeof beanFullName !== "string") || (beanFullName.match(new RegExp(FRAMEWORK_NAMESPACE)));
      };
      let sandboxRegistry = new SandboxRegistry({ injektor, isExcluded });
      assert.isNull(sandboxRegistry.lookup("example"));
      assert.isNull(sandboxRegistry.lookup(FRAMEWORK_NAMESPACE + "-co-sample"));
      assert.isNull(sandboxRegistry.lookup(chores.toFullname(FRAMEWORK_PACKAGE_NAME, "example")));
      assert.deepEqual(sandboxRegistry.lookup("testing/example"), bean3);
    });

    it("lookup() - excludedServices list is supported", function() {
      let context = { scope: FRAMEWORK_PACKAGE_NAME };
      let bean1 = {}; let bean2 = {}; let bean3 = {};
      let injektor = new Injektor({ separator: chores.getSeparator() });
      injektor.registerObject("example", bean1, context);
      injektor.registerObject(FRAMEWORK_NAMESPACE + "-co-sample", bean2);
      injektor.registerObject("testing/example", bean3);
      let excludedServices = [ chores.toFullname(FRAMEWORK_PACKAGE_NAME, "example") ];
      let sandboxRegistry = new SandboxRegistry({ injektor, excludedServices });
      assert.deepEqual(sandboxRegistry.lookup(FRAMEWORK_NAMESPACE + "-co-sample"), bean2);
      assert.isNull(sandboxRegistry.lookup("example"));
      assert.isNull(sandboxRegistry.lookup(chores.toFullname(FRAMEWORK_PACKAGE_NAME, "example")));
      assert.deepEqual(sandboxRegistry.lookup("testing/example"), bean3);
    });

    it("defineService() - RestrictedBeanError", function() {
      let context = { scope: FRAMEWORK_PACKAGE_NAME };

      let injektor = new Injektor({ separator: chores.getSeparator() });
      let _parseName = sinon.spy(injektor, "parseName");
      let _resolveName = sinon.spy(injektor, "resolveName");
      let _defineService = sinon.spy(injektor, "defineService");

      let sandboxRegistry = new SandboxRegistry({ injektor });

      assert.throws(function() {
        sandboxRegistry.defineService(serviceName, SampleService, context);
      }, errors.assertConstructor("RestrictedBeanError"));

      assert.isTrue(_parseName.calledOnce);
      assert.isTrue(_resolveName.notCalled);
      assert.isTrue(_defineService.notCalled);
    });

    it("defineService() - DuplicatedBeanError", function() {
      let injektor = new Injektor({ separator: chores.getSeparator() });
      injektor.registerObject(serviceFullname, {});

      let _parseName = sinon.spy(injektor, "parseName");
      let _resolveName = sinon.spy(injektor, "resolveName");
      let _defineService = sinon.spy(injektor, "defineService");

      let sandboxRegistry = new SandboxRegistry({ injektor });

      assert.throws(function() {
        sandboxRegistry.defineService(serviceName, SampleService, context);
      }, errors.assertConstructor("DuplicatedBeanError"));

      assert.isTrue(_parseName.calledOnce);
      assert.isTrue(_resolveName.calledOnce);
      assert.isTrue(_defineService.notCalled);
    });

    it("defineService() - [scope in context]", function() {
      let injektor = new Injektor({ separator: chores.getSeparator() });
      let _parseName = sinon.spy(injektor, "parseName");
      let _resolveName = sinon.spy(injektor, "resolveName");
      let _defineService = sinon.spy(injektor, "defineService");

      let sandboxRegistry = new SandboxRegistry({ injektor });

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
      let injektor = new Injektor({ separator: chores.getSeparator() });
      let _parseName = sinon.spy(injektor, "parseName");
      let _resolveName = sinon.spy(injektor, "resolveName");
      let _defineService = sinon.spy(injektor, "defineService");

      let sandboxRegistry = new SandboxRegistry({ injektor });

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
});
