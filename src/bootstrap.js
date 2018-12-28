'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const lodash = require('lodash');
const minimist = require('minimist');
const appinfoLoader = require('./backbone/appinfo-loader');
const IssueInspector = require('./backbone/issue-inspector');
const StateInspector = require('./backbone/state-inspector');
const ConfigLoader = require('./backbone/config-loader');
const ContextManager = require('./backbone/context-manager');
const LoggingWrapper = require('./backbone/logging-wrapper');
const NameResolver = require('./backbone/name-resolver');
const chores = require('./utils/chores');
const constx = require('./utils/constx');
const envbox = require('./utils/envbox');
const nodash = require('./utils/nodash');
const Runner = require('./runner');
const Server = require('./server');
const blockRef = chores.getBlockRef(__filename);
const issueInspector = IssueInspector.instance;
const stateInspector = StateInspector.instance;
const FRAMEWORK_CAPNAME = lodash.capitalize(constx.FRAMEWORK.NAME);

function appLoader(params={}) {
  const {logger: L, tracer: T} = params;

  L.has('silly') && L.log('silly', T.add({ context: lodash.cloneDeep(params) }).toMessage({
    tags: [ blockRef, 'constructor-begin', 'appLoader' ],
    text: ' + application loading start ...'
  }));

  L.has('dunce') && L.log('dunce', T.add({ context: params }).toMessage({
    text: ' * application parameters: ${context}'
  }));

  const appRootPath = params.appRootPath;
  const libRootPaths = lodash.map(params.pluginRefs, function(pluginRef) {
    return pluginRef.path;
  });
  const topRootPath = path.join(__dirname, '/..');

  const appInfo = appinfoLoader(appRootPath, libRootPaths, topRootPath);
  const appName = params.appName || appInfo.name || constx.FRAMEWORK.NAME + '-application';
  const appOptions = {
    privateProfile: params.privateProfile || params.privateProfiles,
    privateSandbox: params.privateSandbox || params.privateSandboxes
  };

  L.has('dunce') && L.log('dunce', T.add({ appName }).toMessage({
    text: ' - application name (appName): ${appName}'
  }));

  const appRef = { type: 'application', name: appName };
  if (!lodash.isEmpty(appRootPath)) {
    appRef.path = appRootPath;
  }
  if (lodash.isString(appRef.path)) {
    appRef.manifest = loadManifest(appRef, issueInspector);
    appRef.version = loadPackageVersion(appRef.path);
    if (!chores.isUpgradeSupported('manifest-refiner')) {
      delete appRef.manifest;
      delete appRef.version;
    }
  }
  if (lodash.isObject(params.presets)) {
    appRef.presets = lodash.cloneDeep(params.presets);
  }

  const devebotRef = {
    type: 'framework',
    name: constx.FRAMEWORK.NAME,
    path: topRootPath
  };

  lodash.forOwn(params.pluginRefs, function(ref) {
    ref.type = 'plugin';
    if (!chores.isUpgradeSupported('manifest-refiner')) return;
    ref.manifest = loadManifest(ref, issueInspector);
    ref.version = loadPackageVersion(ref.path);
  });
  lodash.forOwn(params.bridgeRefs, function(ref) {
    ref.type = 'bridge';
    if (!chores.isUpgradeSupported('manifest-refiner')) return;
    ref.manifest = loadManifest(ref, issueInspector);
    ref.version = loadPackageVersion(ref.path);
  });

  // declare user-defined environment variables
  const currentEnvNames = envbox.getEnvNames();
  const evDescriptors = lodash.get(params, ['environmentVarDescriptors'], []);
  const duplicated = lodash.filter(evDescriptors, function(ev) {
    return currentEnvNames.indexOf(ev.name) >= 0;
  });
  if (duplicated.length > 0) {
    issueInspector.collect({
      hasError: true,
      stage: 'bootstrap',
      type: 'application',
      name: appName,
      stack: duplicated.map(function(ev) {
        const evName = chores.stringLabelCase(appName) + '_' + ev.name;
        return util.format('- Environment Variable "%s" has already been defined', evName)
      }).join('\n')
    });
  } else {
    envbox.define(evDescriptors);
  }

  // freeze occupied environment variables
  envbox.setNamespace(chores.stringLabelCase(appName), {
    occupyValues: params.environmentVarOccupied,
    ownershipLabel: util.format('<owned-by-%s>', appName)
  });

  const pluginRefList = lodash.values(params.pluginRefs);
  const bridgeRefList = lodash.values(params.bridgeRefs);
  const nameResolver = new NameResolver({ issueInspector, pluginRefs: pluginRefList, bridgeRefs: bridgeRefList });

  stateInspector.register({ nameResolver, pluginRefs: pluginRefList, bridgeRefs: bridgeRefList });

  const configLoader = new ConfigLoader({appName, appOptions, appRef, devebotRef,
    pluginRefs: params.pluginRefs, bridgeRefs: params.bridgeRefs, issueInspector, stateInspector, nameResolver
  });

  const contextManager = new ContextManager({ issueInspector });
  contextManager.addDefaultFeatures(params.defaultFeatures);

  const app = {};

  let _config;
  Object.defineProperty(app, 'config', {
    get: function() {
      if (_config == undefined || _config == null) {
        _config = configLoader.load();
        _config.appName = appName;
        _config.appInfo = appInfo;
        _config.bridgeRefs = bridgeRefList;
        _config.pluginRefs = [].concat(appRef || [], pluginRefList, devebotRef);
      }
      return _config;
    },
    set: function(value) {}
  });

  let _runner;
  Object.defineProperty(app, 'runner', {
    get: function() {
      const args = { configObject: this.config, contextManager, issueInspector, stateInspector, nameResolver };
      return _runner = _runner || new Runner(args);
    },
    set: function(value) {}
  });

  let _server;
  Object.defineProperty(app, 'server', {
    get: function() {
      const args = { configObject: this.config, contextManager, issueInspector, stateInspector, nameResolver };
      return _server = _server || new Server(args);
    },
    set: function(value) {}
  });

  L.has('silly') && L.log('silly', T.toMessage({
    tags: [ blockRef, 'constructor-end', 'appLoader' ],
    text: ' - Application loading has done'
  }));

  return app;
}

const ATTRS = ['libRootPaths', 'pluginRefs', 'bridgeRefs'];

function registerLayerware(context, pluginNames, bridgeNames) {
  if ((arguments.length < 3) && lodash.isArray(context)) {
    bridgeNames = pluginNames;
    pluginNames = context;
    context = null;
  }

  context = lodash.isString(context) ? { layerRootPath: context } : context;
  if (!lodash.isEmpty(context)) {
    const result = chores.validate(context, constx.BOOTSTRAP.registerLayerware.context.schema);
    if (!result.ok) {
      issueInspector.collect({
        stage: 'bootstrap',
        type: 'application',
        name: 'registerLayerware',
        hasError: true,
        stack: JSON.stringify(result.errors, null, 4)
      });
    }
  }
  context = context || {};

  const loggingWrapper = new LoggingWrapper(blockRef);
  context.logger = loggingWrapper.getLogger();
  context.tracer = loggingWrapper.getTracer();

  if (!lodash.isEmpty(pluginNames)) {
    const result = chores.validate(pluginNames, constx.BOOTSTRAP.registerLayerware.plugins.schema);
    if (!result.ok) {
      issueInspector.collect({
        stage: 'bootstrap',
        type: 'application',
        name: 'registerLayerware',
        hasError: true,
        stack: JSON.stringify(result.errors, null, 4)
      });
    }
  }

  if (!lodash.isEmpty(bridgeNames)) {
    const result = chores.validate(bridgeNames, constx.BOOTSTRAP.registerLayerware.bridges.schema);
    if (!result.ok) {
      issueInspector.collect({
        stage: 'bootstrap',
        type: 'application',
        name: 'registerLayerware',
        hasError: true,
        stack: JSON.stringify(result.errors, null, 4)
      });
    }
  }

  function initialize(context, pluginNames, bridgeNames, accumulator) {
    context = context || {};
    accumulator = accumulator || {};

    const {logger: L, tracer: T} = context;
    lodash.defaults(accumulator, lodash.pick(context, ['logger', 'tracer']));

    if (context.layerRootPath && context.layerRootPath != accumulator.libRootPath) {
      L.has('warn') && L.log('warn', T.add({
        layerRootPath: context.layerRootPath,
        libRootPath: accumulator.libRootPath
      }).toMessage({
        text: ' - layerRootPath is different with libRootPath'
      }));
    }

    if (typeof(context.layerRootPath) === 'string' && context.layerRootPath.length > 0) {
      accumulator.libRootPaths = accumulator.libRootPaths || [];
      accumulator.libRootPaths.push(context.layerRootPath);
    }
  
    if (!chores.isUpgradeSupported('presets')) {
      return expandExtensions(accumulator, pluginNames, bridgeNames);
    }

    if (accumulator.libRootPath) {
      const newPresets = context.presets || {};
      const oldPresets = lodash.get(accumulator, ['pluginRefs', accumulator.libRootPath, 'presets'], null);
      if (oldPresets) {
        lodash.defaultsDeep(oldPresets, newPresets);
      } else {
        lodash.set(accumulator, ['pluginRefs', accumulator.libRootPath, 'presets'], newPresets);
      }
    }
    return expandExtensions(accumulator, pluginNames, bridgeNames);
  };

  return initialize.bind(undefined, context, pluginNames, bridgeNames);
}

function launchApplication(context, pluginNames, bridgeNames) {
  context = lodash.isString(context) ? { appRootPath: context } : context;
  if (!lodash.isEmpty(context)) {
    const result = chores.validate(context, constx.BOOTSTRAP.launchApplication.context.schema);
    if (!result.ok) {
      issueInspector.collect({
        stage: 'bootstrap',
        type: 'application',
        name: 'launchApplication',
        hasError: true,
        stack: JSON.stringify(result.errors, null, 4)
      });
    }
  }
  context = context || {};

  if (lodash.isString(context.appRootPath)) {
    context.libRootPath = context.appRootPath;
  }

  const loggingWrapper = new LoggingWrapper(blockRef);
  context.logger = loggingWrapper.getLogger();
  context.tracer = loggingWrapper.getTracer();

  if (!lodash.isEmpty(pluginNames)) {
    const result = chores.validate(pluginNames, constx.BOOTSTRAP.launchApplication.plugins.schema);
    if (!result.ok) {
      issueInspector.collect({
        stage: 'bootstrap',
        type: 'application',
        name: 'launchApplication',
        hasError: true,
        stack: JSON.stringify(result.errors, null, 4)
      });
    }
  }

  if (!lodash.isEmpty(bridgeNames)) {
    const result = chores.validate(bridgeNames, constx.BOOTSTRAP.launchApplication.bridges.schema);
    if (!result.ok) {
      issueInspector.collect({
        stage: 'bootstrap',
        type: 'application',
        name: 'launchApplication',
        hasError: true,
        stack: JSON.stringify(result.errors, null, 4)
      });
    }
  }

  return appLoader(lodash.assign(context, expandExtensions(lodash.omit(context, ATTRS), pluginNames, bridgeNames)));
}

function expandExtensions(accumulator, pluginNames, bridgeNames) {
  accumulator = accumulator || {};
  accumulator.bridgeRefs = accumulator.bridgeRefs || {};
  accumulator.pluginRefs = accumulator.pluginRefs || {};
  const context = lodash.pick(accumulator, ATTRS.concat(['logger', 'tracer']));
  const {logger: L, tracer: T} = context;

  context.libRootPaths = context.libRootPaths || [];
  context.bridgeRefs = context.bridgeRefs || {};
  context.pluginRefs = context.pluginRefs || {};

  bridgeNames = nodash.arrayify(bridgeNames || []);
  pluginNames = nodash.arrayify(pluginNames || []);

  const CTX = { issueInspector };

  const bridgeInfos = lodash.map(bridgeNames, function(bridgeName) {
    const item = lodash.isString(bridgeName) ? { name: bridgeName, path: bridgeName } : bridgeName;
    if (!chores.isUpgradeSupported('presets')) { return item }
    item.path = locatePackage(CTX, item, 'bridge');
    return item;
  });
  const pluginInfos = lodash.map(pluginNames, function(pluginName) {
    const item = lodash.isString(pluginName) ? { name: pluginName, path: pluginName } : pluginName;
    if (!chores.isUpgradeSupported('presets')) { return item }
    item.path = locatePackage(CTX, item, 'plugin');
    return item;
  });

  // create the bridge & plugin dependencies
  if (lodash.isString(accumulator.libRootPath)) {
    const crateRef = accumulator.pluginRefs[accumulator.libRootPath];
    if (lodash.isObject(crateRef)) {
      crateRef.bridgeDepends = lodash.map(bridgeInfos, function(item) {
        return item.name;
      });
      crateRef.pluginDepends = lodash.map(pluginInfos, function(item) {
        return item.name;
      });
      L.has('debug') && L.log('debug', T.add({
        libRootPath: accumulator.libRootPath,
        crateObject: crateRef
      }).toMessage({
        text: ' - crate "${libRootPath}" object: ${crateObject}'
      }));
    } else {
      L.has('warn') && L.log('warn', T.add({
        libRootPath: accumulator.libRootPath
      }).toMessage({
        text: ' - crate "${libRootPath}" hasnot defined'
      }));
    }
  }

  const bridgeDiffs = lodash.differenceWith(bridgeInfos, lodash.keys(context.bridgeRefs), function(bridgeInfo, bridgeKey) {
    if (!chores.isUpgradeSupported('presets')) {
      return (bridgeInfo.name == bridgeKey);
    }
    return (bridgeInfo.path == bridgeKey);
  });
  const pluginDiffs = lodash.differenceWith(pluginInfos, lodash.keys(context.pluginRefs), function(pluginInfo, pluginKey) {
    if (!chores.isUpgradeSupported('presets')) {
      return (pluginInfo.name == pluginKey);
    }
    return (pluginInfo.path == pluginKey);
  });

  bridgeDiffs.forEach(function(bridgeInfo) {
    if (!chores.isUpgradeSupported('presets')) {
      context.bridgeRefs[bridgeInfo.name] = {
        name: bridgeInfo.name,
        path: locatePackage(CTX, bridgeInfo, 'bridge')
      }
      return;
    }
    const inc = lodash.pick(bridgeInfo, ['name', 'path', 'presets']);
    context.bridgeRefs[bridgeInfo.path] = lodash.assign(context.bridgeRefs[bridgeInfo.path], inc);
  });

  pluginDiffs.forEach(function(pluginInfo) {
    if (!chores.isUpgradeSupported('presets')) {
      context.pluginRefs[pluginInfo.name] = {
        name: pluginInfo.name,
        path: locatePackage(CTX, pluginInfo, 'plugin')
      }
      return;
    }
    const inc = lodash.pick(pluginInfo, ['name', 'path', 'presets']);
    context.pluginRefs[pluginInfo.path] = lodash.assign(context.pluginRefs[pluginInfo.path], inc);
  });

  issueInspector.barrier({ invoker: blockRef, footmark: 'package-touching' });

  const pluginInitializers = lodash.map(pluginDiffs, function(pluginInfo) {
    if (!chores.isUpgradeSupported('presets')) {
      return require(pluginInfo.path);
    }
    return {
      path: pluginInfo.path,
      initializer: require(pluginInfo.path)
    }
  });

  return pluginInitializers.reduce(function(params, pluginInitializer) {
    if (!chores.isUpgradeSupported('presets')) {
      return pluginInitializer(params);
    }
    params.libRootPath = pluginInitializer.path;
    return pluginInitializer.initializer(params);
  }, context);
};

const bootstrap = {};

bootstrap.registerLayerware = registerLayerware;
bootstrap.launchApplication = launchApplication;

// @Deprecated
bootstrap.parseArguments = function(active) {
  return this.initialize('actions', { enabled: active, forced: true });
}

bootstrap.initialize = function(action, options) {
  options = options || {};
  if (['actions', 'tasks'].indexOf(action) >= 0) {
    if (options.enabled !== false) {
      const argv = minimist(process.argv.slice(2));
      const tasks = argv.tasks || argv.actions;
      if (lodash.isEmpty(tasks)) {
        if (options.forced && !lodash.isEmpty(argv._)) {
          console.log('Incorrect task(s). Should be: (--tasks=print-config,check-config)');
          process.exit(0);
        }
      } else {
        const jobs = stateInspector.init({ tasks });
        if (lodash.isEmpty(jobs)) {
          console.log('Unknown task(s): (%s)!', tasks);
          process.exit(0);
        }
      }
    }
  }
  return this;
}

const builtinPackages = ['bluebird', 'lodash', 'injektor', 'logolite', 'schemato', 'semver'];
const internalModules = ['chores', 'loader', 'pinbug', 'errors'];

bootstrap.require = function(packageName) {
  if (builtinPackages.indexOf(packageName) >= 0) return require(packageName);
  if (internalModules.indexOf(packageName) >= 0) return require('./utils/' + packageName);
  if (packageName == 'debug') return require('./utils/pinbug');
  return null;
};

function locatePackage(ctx, pkgInfo, pkgType) {
  try {
    const entrypoint = require.resolve(pkgInfo.path);
    let absolutePath = path.dirname(entrypoint);
    let pkg = loadPackageJson(absolutePath);
    while (pkg === null) {
      let parentPath = path.dirname(absolutePath);
      if (parentPath === absolutePath) break;
      absolutePath = parentPath;
      pkg = loadPackageJson(absolutePath);
    }
    if (pkg && typeof pkg === 'object') {
      if (typeof pkg.main === 'string') {
        let verifiedPath = require.resolve(path.join(absolutePath, pkg.main));
        if (verifiedPath !== entrypoint) {
          throw new Error("package.json file's [main] attribute is mismatched");
        }
      }
      if (typeof pkgInfo.name === 'string') {
        if (pkgInfo.name !== pkg.name) {
          throw new Error('package name is different with provided name');
        }
      }
    } else {
      throw new Error('package.json file is not found or has invalid format');
    }
    return absolutePath;
  } catch (err) {
    ctx.issueInspector.collect({
      stage: 'bootstrap',
      type: pkgType,
      name: pkgInfo.name,
      hasError: true,
      stack: err.stack
    });
    return null;
  }
}

function loadPackageJson(pkgRootPath) {
  try {
    return JSON.parse(fs.readFileSync(path.join(pkgRootPath, '/package.json'), 'utf8'));
  } catch(err) {
    return null;
  }
}

function loadPackageVersion(pkgRootPath) {
  const pkgInfo = loadPackageJson(pkgRootPath);
  return pkgInfo && pkgInfo.version;
}

function loadManifest(pkgRef, issueInspector) {
  chores.assertOk(pkgRef.path, pkgRef.type, pkgRef.name, issueInspector);
  let manifest = null;
  try {
    manifest = require(pkgRef.path).manifest;
    if (!manifest) {
      manifest = require(path.join(pkgRef.path, '/manifest.js'));
    }
  } catch (err) {
    manifest = null;
  }
  if (!lodash.isEmpty(manifest)) {
    const result = chores.validate(manifest, constx.MANIFEST.SCHEMA_OBJECT);
    if (!result.ok) {
      issueInspector.collect({
        stage: 'manifest',
        type: pkgRef.type,
        name: pkgRef.name,
        hasError: true,
        stack: JSON.stringify(result.errors, null, 4)
      });
    }
  }
  return manifest;
}

module.exports = global[constx.FRAMEWORK.NAME] = global[FRAMEWORK_CAPNAME] = bootstrap;
