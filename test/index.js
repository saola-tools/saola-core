'use strict';

var chores = require('../lib/utils/chores');
var constx = require('../lib/utils/constx');
var errors = require('../lib/utils/errors');
var debugx = require('../lib/utils/pinbug')('devebot:test:lab');
var NameResolver = require('../lib/backbone/name-resolver');
var issueInspector = require('../lib/backbone/issue-inspector').instance;
var stateInspector = require('../lib/backbone/state-inspector').instance;
var lodash = require('lodash');
var path = require('path');
var Injektor = require('injektor');
var freshy = require('freshy');

// EventEmitter memory leak detecting
var max = 12;
var EventEmitter = require('events').EventEmitter;
EventEmitter.defaultMaxListeners = max;
process.on('warning', function(e) {
  console.warn('Exception thrown with MaxListeners: %s. StackTrace:', max);
  console.warn(e.stack);
});

var lab = module.exports = {
  getApiConfig: function(ext) {
    ext = ext || {};
    return lodash.merge({
      host: '127.0.0.1',
      port: 17779,
      path: '/demo-app',
      authen: {
        token_key: 'devebot',
        token_secret: 's3cr3tpa$$w0rd'
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
  getAppHome: function(appName) {
    return path.join(__dirname, 'app', appName);
  },
  getApp: function(appName) {
    appName = appName || 'default';
    return require(this.getAppHome(appName));
  },
  getAppCfgDir: function(appName, cfgName) {
    cfgName = cfgName || 'config';
    return path.join(__dirname, 'app', appName, cfgName);
  },
  getLibHome: function(libName) {
    return path.join(__dirname, './lib/', libName);
  },
  getLib: function(libName) {
    return require(this.getLibHome(libName));
  },
  getLibCfgDir: function(libName) {
    return path.join(this.getLibHome(libName), 'config');
  },
  getDevebotHome: function() {
    return path.join(__dirname, '../');
  },
  getDevebot: function() {
    return require(this.getDevebotHome());
  },
  getDevebotCfgDir: function() {
    return path.join(this.getDevebotHome(), 'config');
  },
  getDevebotModule: function(moduleFile) {
    return path.join(this.getDevebotHome(), 'lib/', moduleFile);
  },
  getDefaultTimeout: function() {
    return 60000;
  },
  getFrameworkInfo: function() {
    return chores.loadPackageInfo(this.getDevebotHome());
  },
  getIssueInspector: function() {
    return issueInspector;
  },
  getStateInspector: function() {
    return stateInspector;
  },
  getNameResolver: function(bridgeNames, pluginNames) {
    return new NameResolver({
      issueInspector,
      bridgeRefs: lodash.map(bridgeNames, function(name) {
        return { name, path: lab.getLibHome(name) }
      }),
      pluginRefs: lodash.map(pluginNames, function(name) {
        return { name, path: lab.getLibHome(name) }
      })
    });
  },
  unloadApp: function(appName) {
    appName = appName || 'default';
    freshy.unload(require.resolve(this.getAppHome(appName)));
    return appName;
  }
}

var _initInjectedObjects = function(appName, injectedObjects) {
  injectedObjects = injectedObjects || {
    profileConfig: {},
    bridgeRefs: [],
    pluginRefs: []
  };
  if (appName) {
    var app = lab.getApp(appName);
    injectedObjects.profileConfig = app.config.profile || {
      logger: {
        transports: {
          console: {
            type: 'console',
            level: 'debug',
            json: false,
            timestamp: true,
            colorize: true
          }
        }
      }
    }
    injectedObjects.bridgeRefs = app.config.bridgeRefs || [];
    injectedObjects.pluginRefs = app.config.pluginRefs || [];
  }
  injectedObjects.issueInspector = issueInspector;
  return injectedObjects;
}

var _attachInjectedObjects = function(injektor, injectedObjects) {
  lodash.forOwn(injectedObjects, function(injectedObject, name) {
    injektor.registerObject(name, injectedObject, chores.injektorContext);
  });
}

var _loadBackboneServices = function(injektor, names) {
  var bbPath = path.join(lab.getDevebotHome(), 'lib/backbone');
  lodash.forOwn(chores.loadServiceByNames({}, bbPath, names), function(constructor, name) {
    injektor.defineService(name, constructor, chores.injektorContext);
  });
}

lab.getContextManager = function(appName) {
  var app = lab.getApp(appName);
  return app.runner.getSandboxService('contextManager', { scope: 'devebot' });
}

lab.createKernel = function(appName) {
  var _config = null;
  if (appName) {
    var app = lab.getApp(appName);
    _config = app.config;
  }
  if (_config === null) return null;

  if (false) {
    console.log('==@ createKernel() with: %s', JSON.stringify(_config, null, 2));
    console.log('==/ createKernel() ========');
  }

  let nameResolver = new NameResolver({issueInspector, 
    pluginRefs: _config.pluginRefs, bridgeRefs: _config.bridgeRefs});

  var Kernel = require(path.join(lab.getDevebotHome(), 'lib/kernel.js'));
  return new Kernel({configObject: _config, issueInspector, stateInspector, nameResolver});
}

lab.createBasicServices = function(appName, injectedObjects) {
  injectedObjects = _initInjectedObjects(appName, injectedObjects);
  var injektor = new Injektor({ separator: chores.getSeparator() });
  _attachInjectedObjects(injektor, injectedObjects);
  _loadBackboneServices(injektor, [ 'schema-validator', 'logging-factory' ]);
  return {
    loggingFactory: injektor.lookup('loggingFactory'),
    schemaValidator: injektor.lookup('schemaValidator')
  }
}

lab.createBridgeLoader = function(appName, injectedObjects) {
  injectedObjects = _initInjectedObjects(appName, injectedObjects);
  var injektor = new Injektor({ separator: chores.getSeparator() });
  _attachInjectedObjects(injektor, injectedObjects);
  _loadBackboneServices(injektor, [
    'bridge-loader', 'schema-validator', 'logging-factory', 'name-resolver'
  ]);
  return injektor.lookup('bridgeLoader');
}

lab.createPluginLoader = function(appName, injectedObjects) {
  injectedObjects = _initInjectedObjects(appName, injectedObjects);
  var injektor = new Injektor({ separator: chores.getSeparator() });
  _attachInjectedObjects(injektor, injectedObjects);
  _loadBackboneServices(injektor, [
    'plugin-loader', 'name-resolver', 'schema-validator', 'logging-factory'
  ]);
  return injektor.lookup('pluginLoader');
}

lab.createProcessManager = function(appName, injectedObjects) {
  injectedObjects = lodash.assign({
    profileConfig: {}
  }, injectedObjects);
  if (appName) {
    var app = lab.getApp(appName);
    injectedObjects.profileConfig = app.config.profile.mixture;
  }
  injectedObjects.issueInspector = issueInspector;
  var injektor = new Injektor({ separator: chores.getSeparator() });
  _attachInjectedObjects(injektor, injectedObjects);
  _loadBackboneServices(injektor, [
    'logging-factory', 'process-manager'
  ]);
  return injektor.lookup('processManager');
}

lab.createRunhookManager = function(appName, injectedObjects) {
  injectedObjects = lodash.assign({
    appName: appName || 'unknown',
    appInfo: {},
    pluginRefs: [],
    bridgeRefs: [],
    injectedHandlers: {}
  }, injectedObjects);
  if (appName) {
    var app = lab.getApp(appName);
    injectedObjects.appName = app.config.appName;
    injectedObjects.appInfo = app.config.appInfo;
    injectedObjects.profileName = app.config.profile.names.join(',');
    injectedObjects.profileConfig = app.config.profile.mixture;
    injectedObjects.sandboxName = app.config.sandbox.names.join(',');
    injectedObjects.sandboxConfig = app.config.sandbox.mixture;
    injectedObjects.pluginRefs = app.config.pluginRefs;
    injectedObjects.bridgeRefs = app.config.bridgeRefs;
    injectedObjects.injectedHandlers = {};
  }
  injectedObjects.issueInspector = issueInspector;
  var injektor = new Injektor({ separator: chores.getSeparator() });
  _attachInjectedObjects(injektor, injectedObjects);
  _loadBackboneServices(injektor, [
    'runhook-manager', 'plugin-loader', 'name-resolver', 'schema-validator', 'logging-factory', 'jobqueue-binder'
  ]);
  return injektor.lookup('runhookManager');
}

lab.createSandboxManager = function(appName, injectedObjects) {
  injectedObjects = lodash.assign({
    appName: appName || 'unknown',
    appInfo: {},
    profileNames: [ 'default' ],
    profileConfig: {},
    sandboxNames: [ 'default' ],
    sandboxConfig: {},
    bridgeRefs: [],
    pluginRefs: []
  }, injectedObjects);
  if (appName) {
    var app = lab.getApp(appName);
    false && console.log('[%s].config: %s', appName, JSON.stringify(app.config, null, 2));
    injectedObjects.appName = app.config.appName;
    injectedObjects.appInfo = app.config.appInfo;
    injectedObjects.profileNames = app.config.profile.names;
    injectedObjects.profileConfig = app.config.profile.mixture;
    injectedObjects.sandboxNames = app.config.sandbox.names;
    injectedObjects.sandboxConfig = app.config.sandbox.mixture;
    injectedObjects.bridgeRefs = app.config.bridgeRefs;
    injectedObjects.pluginRefs = app.config.pluginRefs;
  }
  injectedObjects.issueInspector = issueInspector;
  var injektor = new Injektor({ separator: chores.getSeparator() });
  _attachInjectedObjects(injektor, injectedObjects);
  _loadBackboneServices(injektor, [
    'context-manager', 'sandbox-manager', 'bridge-loader', 'plugin-loader', 'schema-validator', 'logging-factory', 'name-resolver', 'process-manager'
  ]);
  return injektor.lookup('sandboxManager');
}

lab.isUpgradeSupported = function(features) {
  return chores.isUpgradeSupported(features);
}

lab.simplifyCommands = function(commands) {
  var transformCommand = function(command) {
    command = lodash.cloneDeep(command);
    if (lodash.isFunction(lodash.get(command, 'validate', null))) {
      lodash.set(command, 'validate', '[Function]');
    }
    if (lodash.isString(lodash.get(command, 'description', null))) {
      lodash.set(command, 'description', '[String]');
    }
    if (lodash.isArray(lodash.get(command, 'options', null))) {
      command.options = lodash.map(command.options, function(opt) {
        if (lodash.isString(opt.description)) {
          opt.description = '[String]'
        }
        return opt;
      });
    }
    return command;
  };
  return lodash.map(commands, transformCommand);
}

lab.simplifyRoutines = function(routines) {
  var transformRoutine = function(routine) {
    routine = lodash.cloneDeep(routine);
    if (lodash.isFunction(lodash.get(routine, 'object.handler', null))) {
      routine.object.handler = '[Function]';
    }
    if (lodash.isFunction(lodash.get(routine, 'object.info.validate', null))) {
      lodash.set(routine, 'object.info.validate', '[Function]');
    }
    if (lodash.isString(lodash.get(routine, 'object.info.description', null))) {
      lodash.set(routine, 'object.info.description', '[String]');
    }
    if (lodash.isArray(lodash.get(routine, 'object.info.options', null))) {
      routine.object.info.options = lodash.map(routine.object.info.options, function(opt) {
        if (lodash.isString(opt.description)) {
          opt.description = '[String]'
        }
        return opt;
      });
    }
    return routine;
  };
  return lodash.mapValues(routines, transformRoutine);
}

lab.ProcessExitError = errors.createConstructor('ProcessExitError');

lab.preventExit = function(options, block) {
  options = options || {};

  var counter = 0;
  var refExit = process.exit;

  process.exit = function(code) {
    counter += 1;
    debugx.enabled && debugx(' - process.exit(%s) is invoked', code);
    if (options.throwException) {
      throw new lab.ProcessExitError('process.exit() is invoked', {
        code: code,
        count: counter
      });
    }
  }

  var unhook = function() {
    if (typeof refExit === 'function') {
      process.exit = refExit;
      refExit = null;
    }
    return counter;
  }

  if (typeof block === 'function') {
    block(unhook);
  }

  return unhook;
}
