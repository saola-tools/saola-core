"use strict";

const appRootPath = require("app-root-path");
const path = require("path");
const freshy = require("freshy");
const { sinon, rewire } = require("liberica");

const chores = require("../lib/utils/chores");
const constx = require("../lib/utils/constx");
const errors = require("../lib/utils/errors");
const NameResolver = require("../lib/backbone/name-resolver");
const ManifestHandler = require("../lib/backbone/manifest-handler");
const issueInspector = require("../lib/backbone/issue-inspector").instance;
const stateInspector = require("../lib/backbone/state-inspector").instance;
const packageStocker = require("../lib/backbone/package-stocker").instance;

const FRWK = require(path.join(__dirname, "../"));
const LogConfig = FRWK.require("logolite").LogConfig;
const LogTracer = FRWK.require("logolite").LogTracer;
const Injektor = FRWK.require("injektor");
const lodash = FRWK.require("lodash");

global.FRWK = FRWK;

const FRAMEWORK_NAMESPACE = constx.FRAMEWORK.NAMESPACE;

// EventEmitter memory leak detecting
const max = 12;
const EventEmitter = require("events").EventEmitter;
EventEmitter.defaultMaxListeners = max;
process.on("warning", function(e) {
  console.warn("Exception thrown with MaxListeners: %s. StackTrace:", max);
  console.warn(e.stack);
});

// const TEST_HOME_DIR = String(__dirname).replace(new RegExp(path.join(path.sep, "test") + "$"), "");
const TEST_HOME_DIR = appRootPath.resolve("..");

const lab = module.exports = {
  getApiConfig: function(ext) {
    ext = ext || {};
    return lodash.merge({
      host: "127.0.0.1",
      port: 17779,
      path: "/demo-app",
      authen: {
        token_key: "devebot",
        token_secret: "s3cr3tpa$$w0rd"
      },
      stateMap: {
        "definition": "definition",
        "started": "started",
        "progress": "progress",
        "timeout": "timeout",
        "failed": "failed",
        "cancelled": "cancelled",
        "completed": "completed",
        "done": "done",
        "noop": "noop"
      }
    }, ext);
  },
  getRelativePathOf: function(dir) {
    return dir.replace(TEST_HOME_DIR, "");
  },
  getAppHome: function(appName) {
    return path.join(__dirname, "app", appName);
  },
  getApp: function(appName) {
    appName = appName || "default";
    return require(this.getAppHome(appName));
  },
  getAppCfgDir: function(appName, cfgName) {
    cfgName = cfgName || "config";
    return path.join(__dirname, "app", appName, cfgName);
  },
  getLibHome: function(libName) {
    return path.join(__dirname, "./lib/", libName);
  },
  getLib: function(libName) {
    return require(this.getLibHome(libName));
  },
  getLibCfgDir: function(libName) {
    return path.join(this.getLibHome(libName), "config");
  },
  getFramework: function() {
    return require(this.getFrameworkHome());
  },
  getFrameworkHome: function() {
    return path.join(__dirname, "../");
  },
  getFrameworkCfgDir: function() {
    return path.join(this.getFrameworkHome(), "config");
  },
  getFrameworkModule: function(moduleFile) {
    return path.join(this.getFrameworkHome(), "lib/", moduleFile);
  },
  getFrameworkInfo: function() {
    return chores.loadPackageInfo(this.getFrameworkHome(), constx.APPINFO.FIELDS, {});
  },
  getFrameworkApi: function() {
    return require("devebot-api");
  },
  getPrefixScopedName: function() {
    return "@" + FRAMEWORK_NAMESPACE + "/";
  },
  getDefaultTimeout: function() {
    return 60000;
  },
  getIssueInspector: function() {
    return issueInspector;
  },
  getStateInspector: function() {
    return stateInspector;
  },
  getPackageStocker: function() {
    return packageStocker;
  },
  getNameResolver: function(pluginDescriptors, bridgeDescriptors) {
    return new NameResolver({
      issueInspector,
      bridgeList: lodash.map(bridgeDescriptors, function(descriptor) {
        if (lodash.isString(descriptor)) {
          descriptor = { name: descriptor, path: lab.getLibHome(descriptor) };
        }
        return descriptor;
      }),
      pluginList: lodash.map(pluginDescriptors, function(descriptor) {
        if (lodash.isString(descriptor)) {
          descriptor = { name: descriptor, path: lab.getLibHome(descriptor) };
        }
        return descriptor;
      })
    });
  },
  unloadApp: function(appName) {
    appName = appName || "default";
    freshy.unload(require.resolve(this.getAppHome(appName)));
    return appName;
  },
  require: function(pkg) {
    return require(pkg);
  }
};

function deleteModule (moduleName) {
  let solvedName = require.resolve(moduleName);
    let nodeModule = require.cache[solvedName];
  if (nodeModule) {
    for (let i = 0; i < nodeModule.children.length; i++) {
      let child = nodeModule.children[i];
      deleteModule(child.filename);
    }
    delete require.cache[solvedName];
  }
}

const _initInjectedObjects = function(appName, injectedObjects) {
  injectedObjects = injectedObjects || {
    appName: appName || "unknown",
    appInfo: {},
    profileNames: [ "default" ],
    profileConfig: {},
    sandboxNames: [ "default" ],
    sandboxOrigin: {},
    sandboxConfig: {},
    textureNames: [ "default" ],
    textureConfig: {},
    bridgeList: [],
    bundleList: [],
    pluginList: [],
    injectedHandlers: {},
  };
  if (appName) {
    let app = lab.getApp(appName);
    injectedObjects.appName = app.config.appName || injectedObjects.appName;
    injectedObjects.appInfo = app.config.appInfo || injectedObjects.appInfo;
    lodash.forEach(["profile", "sandbox", "texture"], function(name) {
      injectedObjects[name + "Names"] = app.config[name].names;
      injectedObjects[name + "Name"] = app.config[name].names.join(",");
      injectedObjects[name + "Config"] = app.config[name].mixture;
    });
    injectedObjects.profileConfig = injectedObjects.profileConfig || {
      logger: {
        transports: {
          console: {
            type: "console",
            level: "debug",
            json: false,
            timestamp: true,
            colorize: true
          }
        }
      }
    };
    injectedObjects.bridgeList = app.config.bridgeList || [];
    injectedObjects.bundleList = app.config.bundleList || [];
    injectedObjects.pluginList = lab.extractPluginList(injectedObjects.bundleList);
  }
  injectedObjects.issueInspector = issueInspector;
  return injectedObjects;
};

const _attachInjectedObjects = function(injektor, injectedObjects) {
  lodash.forOwn(injectedObjects, function(injectedObject, name) {
    injektor.registerObject(name, injectedObject, chores.injektorContext);
  });
};

const _loadBackboneServices = function(injektor, names) {
  let bbPath = path.join(lab.getFrameworkHome(), "lib/backbone");
  lodash.forOwn(chores.loadServiceByNames({}, bbPath, names), function(constructor, name) {
    injektor.defineService(name, constructor, chores.injektorContext);
  });
};

lab.requireFrameworkModule = function(moduleLocation) {
  return require(this.getFrameworkModule(moduleLocation));
};

lab.acquireFrameworkModule = function(moduleLocation) {
  return rewire(this.getFrameworkModule(moduleLocation));
};

lab.acquire = function(moduleName) {
  return rewire(moduleName);
};

lab.initBackboneService = function(serviceName, injectedObjects) {
  let bbPath = path.join(lab.getFrameworkHome(), "lib/backbone");
  const injektor = new Injektor({ separator: chores.getSeparator() });
  _attachInjectedObjects(injektor, injectedObjects);
  lodash.forOwn(chores.loadServiceByNames({}, bbPath, serviceName), function(constructor, name) {
    injektor.defineService(name, constructor, chores.injektorContext);
  });
  return injektor.lookup(chores.stringCamelCase(serviceName));
};

lab.extractPluginList = function(bundleList) {
  return lodash.filter(bundleList, function(bundleInfo) {
    return bundleInfo.type === "plugin";
  });
};

lab.getContextManager = function(appName) {
  let app = lab.getApp(appName);
  return app.runner.getSandboxService("contextManager", chores.injektorContext);
};

lab.createKernel = function(appName) {
  let _config = null;
  if (appName) {
    let app = lab.getApp(appName);
    _config = app.config;
  }
  if (_config === null) return null;

  const nameResolver = new NameResolver({issueInspector,
    pluginList: _config.bundleList, bridgeList: _config.bridgeList});

    const manifestHandler = new ManifestHandler({nameResolver,
    bundleList: _config.bundleList, bridgeList: _config.bridgeList});

    const Kernel = require(path.join(lab.getFrameworkHome(), "lib/kernel.js"));
  return new Kernel({
    configObject: _config,
    bridgeList: _config.bridgeList,
    bundleList: _config.bundleList,
    issueInspector,
    stateInspector,
    nameResolver,
    manifestHandler
  });
};

lab.createBasicServices = function(appName, injectedObjects) {
  const injektor = new Injektor({ separator: chores.getSeparator() });
  _attachInjectedObjects(injektor, _initInjectedObjects(appName, injectedObjects));
  _loadBackboneServices(injektor, [ "schema-validator", "logging-factory" ]);
  return {
    loggingFactory: injektor.lookup("loggingFactory"),
    schemaValidator: injektor.lookup("schemaValidator")
  };
};

lab.createObjectDecorator = function(appName, injectedObjects) {
  const injektor = new Injektor({ separator: chores.getSeparator() });
  _attachInjectedObjects(injektor, _initInjectedObjects(appName, injectedObjects));
  _loadBackboneServices(injektor, [
    "object-decorator", "schema-validator", "logging-factory"
  ]);
  return injektor.lookup("objectDecorator");
};

lab.createBridgeLoader = function(appName, injectedObjects) {
  const injektor = new Injektor({ separator: chores.getSeparator() });
  _attachInjectedObjects(injektor, _initInjectedObjects(appName, injectedObjects));
  _loadBackboneServices(injektor, [
    "bridge-loader", "schema-validator", "logging-factory", "name-resolver", "object-decorator"
  ]);
  return injektor.lookup("bridgeLoader");
};

lab.createBundleLoader = function(appName, injectedObjects) {
  const injektor = new Injektor({ separator: chores.getSeparator() });
  _attachInjectedObjects(injektor, _initInjectedObjects(appName, injectedObjects));
  _loadBackboneServices(injektor, [
    "bundle-loader", "name-resolver", "schema-validator", "logging-factory", "object-decorator"
  ]);
  return injektor.lookup("bundleLoader");
};

lab.createProcessManager = function(appName, injectedObjects) {
  injectedObjects = lodash.assign({
    profileConfig: {}
  }, injectedObjects);
  if (appName) {
    let app = lab.getApp(appName);
    injectedObjects.profileConfig = app.config.profile.mixture;
  }
  injectedObjects.issueInspector = issueInspector;
  const injektor = new Injektor({ separator: chores.getSeparator() });
  _attachInjectedObjects(injektor, injectedObjects);
  _loadBackboneServices(injektor, [
    "logging-factory", "process-manager"
  ]);
  return injektor.lookup("processManager");
};

lab.createRunhookManager = function(appName, injectedObjects) {
  const injektor = new Injektor({ separator: chores.getSeparator() });
  _attachInjectedObjects(injektor, _initInjectedObjects(appName, injectedObjects));
  _loadBackboneServices(injektor, [
    "runhook-manager", "bundle-loader", "jobqueue-binder",
    "schema-validator", "logging-factory", "object-decorator", "name-resolver"
  ]);
  return injektor.lookup("runhookManager");
};

lab.createSandboxManager = function(appName, injectedObjects) {
  const injektor = new Injektor({ separator: chores.getSeparator() });
  _attachInjectedObjects(injektor, _initInjectedObjects(appName, injectedObjects));
  let serviceNames = [
    "context-manager", "sandbox-manager", "bridge-loader", "bundle-loader",
    "schema-validator", "logging-factory", "object-decorator", "name-resolver",
    "process-manager"
  ];
  if (chores.isUpgradeSupported("builtin-mapping-loader")) {
    serviceNames.push("mapping-loader");
  }
  _loadBackboneServices(injektor, serviceNames);
  return injektor.lookup("sandboxManager");
};

function LoggingFactoryMock (params) {
  params = params || {};
  this.branch = function(blockRef) { return this; };
  this.getLogger = function() { return logger; };
  this.getTracer = function() { return tracer; };
  this.getTracerStore = function() { return tracerStore; };
  this.resetHistory = function() {
    logger.has.resetHistory();
    logger.log.resetHistory();
    tracer.add.resetHistory();
    tracer.toMessage.resetHistory();
    tracerStore.add.splice(0);
    tracerStore.toMessage.splice(0);
  };
  let logger = {
    has: sinon.stub().returns(true),
    log: sinon.stub()
  };
  let tracerStore = { add: [], toMessage: [] };
  let tracer = {
    add: sinon.stub().callsFake(function(params) {
      if (params.captureMethodCall !== false) {
        tracerStore.add.push(lodash.cloneDeep(params));
      }
      LogTracer.ROOT.add(params);
      return tracer;
    }),
    toMessage: sinon.stub().callsFake(function(params) {
      if (params.captureMethodCall !== false) {
        tracerStore.toMessage.push(lodash.cloneDeep(params));
      }
      return LogTracer.ROOT.toMessage(params);
    }),
    get: function(key) {
      if (key === "instanceId" && "instanceId" in params) {
        return params["instanceId"];
      }
      return LogTracer.ROOT.get(key);
    }
  };
}

lab.createLoggingFactoryMock = function(params) {
  return new LoggingFactoryMock(params);
};

lab.spyModuleFunction = function(rewiredModule, functionName) {
  let proxyFunction = sinon.spy(rewiredModule.__get__(functionName));
  rewiredModule.__set__(functionName, proxyFunction);
  return proxyFunction;
};

lab.stubModuleFunction = function(rewiredModule, functionName) {
  let proxyFunction = sinon.stub();
  rewiredModule.__set__(functionName, proxyFunction);
  return proxyFunction;
};

lab.isUpgradeSupported = function(features) {
  return chores.isUpgradeSupported(features);
};

lab.simplifyCommands = function(commands) {
  function transformCommand (command) {
    command = lodash.cloneDeep(command);
    if (lodash.isFunction(lodash.get(command, "validate", null))) {
      lodash.set(command, "validate", "[Function]");
    }
    if (lodash.isString(lodash.get(command, "description", null))) {
      lodash.set(command, "description", "[String]");
    }
    if (lodash.isArray(lodash.get(command, "options", null))) {
      command.options = lodash.map(command.options, function(opt) {
        if (lodash.isString(opt.description)) {
          opt.description = "[String]";
        }
        return opt;
      });
    }
    return command;
  };
  return lodash.map(commands, transformCommand);
};

lab.simplifyRoutines = function(routines) {
  function transformRoutine (routine) {
    routine = lodash.cloneDeep(routine);
    if (lodash.isFunction(lodash.get(routine, "object.handler", null))) {
      routine.object.handler = "[Function]";
    }
    if (lodash.isFunction(lodash.get(routine, "object.info.validate", null))) {
      lodash.set(routine, "object.info.validate", "[Function]");
    }
    if (lodash.isString(lodash.get(routine, "object.info.description", null))) {
      lodash.set(routine, "object.info.description", "[String]");
    }
    if (lodash.isArray(lodash.get(routine, "object.info.options", null))) {
      routine.object.info.options = lodash.map(routine.object.info.options, function(opt) {
        if (lodash.isString(opt.description)) {
          opt.description = "[String]";
        }
        return opt;
      });
    }
    return routine;
  };
  return lodash.mapValues(routines, transformRoutine);
};

lab.ProcessExitError = errors.createConstructor("ProcessExitError");

lab.preventExit = function(options, block) {
  options = options || {};

  let counter = 0;
  let refExit = process.exit;

  process.exit = function(code) {
    counter += 1;
    if (options.throwException) {
      throw new lab.ProcessExitError("process.exit() is invoked", {
        code: code,
        count: counter
      });
    }
  };

  const unhook = function() {
    if (typeof refExit === "function") {
      process.exit = refExit;
      refExit = null;
    }
    return counter;
  };

  if (typeof block === "function") {
    block(unhook);
  }

  return unhook;
};
