'use strict';

const lodash = require('lodash');
const util = require('util');
const path = require('path');
const chores = require('../utils/chores');
const constx = require('../utils/constx');
const loader = require('../utils/loader');
const envbox = require('../utils/envbox');
const nodash = require('../utils/nodash');
const LoggingWrapper = require('./logging-wrapper');
const blockRef = chores.getBlockRef(__filename);

const CONFIG_SUBDIR = '/config';
const CONFIG_VAR_NAMES = [ 'PROFILE',  'SANDBOX',  'TEXTURE', 'CONFIG_DIR', 'CONFIG_ENV' ];
const CONFIG_PROFILE_NAME = 'profile';
const CONFIG_SANDBOX_NAME = 'sandbox';
const CONFIG_TEXTURE_NAME = 'texture';
const CONFIG_TYPES = [CONFIG_PROFILE_NAME, CONFIG_SANDBOX_NAME, CONFIG_TEXTURE_NAME];
const RELOADING_FORCED = true;

function ConfigLoader(params={}) {
  let {appName, appOptions, appRef, devebotRef, pluginRefs, bridgeRefs, issueInspector, stateInspector, nameResolver} = params;
  let loggingWrapper = new LoggingWrapper(blockRef);
  let L = loggingWrapper.getLogger();
  let T = loggingWrapper.getTracer();
  let CTX = { L, T, issueInspector, stateInspector, nameResolver };

  let label = chores.stringLabelCase(appName);

  L.has('silly') && L.log('silly', T.add({ appName, appOptions, appRef, devebotRef, pluginRefs, bridgeRefs, label }).toMessage({
    tags: [ blockRef, 'constructor-begin' ],
    text: ' + Config of application (${appName}) is loaded in name: ${label}'
  }));

  appOptions = appOptions || {};

  this.load = function() {
    return loadConfig.bind(null, CTX, appName, appOptions, appRef, devebotRef, pluginRefs, bridgeRefs)
        .apply(null, CONFIG_VAR_NAMES.map(readVariable.bind(null, CTX, label)));
  }

  L.has('silly') && L.log('silly', T.toMessage({
    tags: [ blockRef, 'constructor-end' ],
    text: ' - constructor has finished'
  }));
}

module.exports = ConfigLoader;

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ private members

let readVariable = function(ctx, appLabel, varName) {
  let { L, T } = ctx || this;
  let varLabels = [
    util.format('%s_%s', appLabel, varName),
    util.format('%s_%s', 'DEVEBOT', varName),
    util.format('NODE_%s_%s', appLabel, varName),
    util.format('NODE_%s_%s', 'DEVEBOT', varName)
  ];
  let value, varLabel;
  for(const varLabel of varLabels) {
    value = envbox.getEnv(varLabel);
    L.has('dunce') && L.log('dunce', T.add({ label: varLabel, value }).toMessage({
      text: ' - Get value of ${label}: ${value}'
    }));
    if (value) break;
  }
  L.has('dunce') && L.log('dunce', T.add({ label: varLabels[0], value }).toMessage({
    text: ' - Final value of ${label}: ${value}'
  }));
  return value;
}

let loadConfig = function(ctx, appName, appOptions, appRef, devebotRef, pluginRefs, bridgeRefs, profileName, sandboxName, textureName, customDir, customEnv) {
  let { L, T, issueInspector, stateInspector, nameResolver } = ctx || this;

  const ALIASES_OF = buildConfigTypeAliases();
  L.has('silly') && L.log('silly', T.add({ aliasesOf: ALIASES_OF }).toMessage({
    tags: [ blockRef, 'config-dir', 'aliases-of' ],
    text: ' - configType aliases mapping: ${aliasesOf}'
  }));

  let transCTX = { L, T, issueInspector, nameResolver, CONFIG_PROFILE_NAME, CONFIG_SANDBOX_NAME, CONFIG_TEXTURE_NAME };
  if (!chores.isUpgradeSupported(['simplify-name-resolver'])) {
    let {plugin: pluginAliasMap, bridge: bridgeAliasMap} = nameResolver.getAbsoluteAliasMap();
    transCTX = { L, T, issueInspector, pluginAliasMap, bridgeAliasMap, CONFIG_PROFILE_NAME, CONFIG_SANDBOX_NAME, CONFIG_TEXTURE_NAME };
  }

  let libRefs = lodash.values(pluginRefs);
  if (devebotRef) {
    libRefs.push(devebotRef);
  }

  let appRootDir = null;
  if (appRef && lodash.isString(appRef.path)) {
    appRootDir = appRef.path;
  };

  let config = {};

  let defaultConfigDir = appRootDir ? path.join(appRootDir, CONFIG_SUBDIR) : null;
  L.has('silly') && L.log('silly', T.add({ configDir: defaultConfigDir }).toMessage({
    tags: [ blockRef, 'config-dir', 'internal-config-dir' ],
    text: ' - internal configDir: ${configDir}'
  }));

  let externalConfigDir = resolveConfigDir(ctx, appName, appRootDir, customDir, customEnv);
  L.has('silly') && L.log('silly', T.add({ configDir: externalConfigDir }).toMessage({
    tags: [ blockRef, 'config-dir', 'external-config-dir' ],
    text: ' - external configDir: ${configDir}'
  }));

  let includedNames = buildConfigTileNames(ctx, appOptions, profileName, sandboxName, textureName);
  L.has('dunce') && L.log('dunce', T.add({ includedNames }).toMessage({
    text: ' + included names: ${includedNames}'
  }));

  loadConfigOfModules(transCTX, config, ALIASES_OF, includedNames, libRefs, defaultConfigDir, externalConfigDir);

  lodash.forEach([CONFIG_SANDBOX_NAME, CONFIG_TEXTURE_NAME], function(configType) {
    if (chores.isUpgradeSupported('standardizing-config')) {
      if (chores.isUpgradeSupported(['simplify-name-resolver'])) {
        applyAliasMap(ctx, config[configType].default, nameResolver.getDefaultAliasOf);
        applyAliasMap(ctx, config[configType].expanse, nameResolver.getDefaultAliasOf);
        applyAliasMap(ctx, config[configType].mixture, nameResolver.getDefaultAliasOf);
      } else {
        let {plugin: pluginReverseMap, bridge: bridgeReverseMap} = nameResolver.getRelativeAliasMap();
        doAliasMap(ctx, config[configType].default, pluginReverseMap, bridgeReverseMap);
        doAliasMap(ctx, config[configType].expanse, pluginReverseMap, bridgeReverseMap);
        doAliasMap(ctx, config[configType].mixture, pluginReverseMap, bridgeReverseMap);
      }
      stateInspector.collect({config});
    }
  });

  issueInspector.barrier({ invoker: blockRef, footmark: 'config-file-loading' });

  return config;
}

function buildConfigTypeAliases() {
  const ALIASES_OF = {};
  ALIASES_OF[CONFIG_PROFILE_NAME] = lodash.clone(envbox.getEnv('CONFIG_PROFILE_ALIASES'));
  ALIASES_OF[CONFIG_PROFILE_NAME].unshift(CONFIG_PROFILE_NAME);
  ALIASES_OF[CONFIG_SANDBOX_NAME] = lodash.clone(envbox.getEnv('CONFIG_SANDBOX_ALIASES'));
  ALIASES_OF[CONFIG_SANDBOX_NAME].unshift(CONFIG_SANDBOX_NAME);
  ALIASES_OF[CONFIG_TEXTURE_NAME] = lodash.clone(envbox.getEnv('CONFIG_TEXTURE_ALIASES'));
  ALIASES_OF[CONFIG_TEXTURE_NAME].unshift(CONFIG_TEXTURE_NAME);
  return ALIASES_OF;
}

function buildConfigTileNames(ctx, appOptions, profileName, sandboxName, textureName) {
  appOptions = appOptions || {};

  let includedNames = {};
  includedNames[CONFIG_PROFILE_NAME] = standardizeNames(ctx, profileName);
  includedNames[CONFIG_SANDBOX_NAME] = standardizeNames(ctx, sandboxName);
  includedNames[CONFIG_TEXTURE_NAME] = standardizeNames(ctx, textureName);

  let appProfiles = standardizeNames(ctx, appOptions.privateProfile || appOptions.privateProfiles);
  includedNames[CONFIG_PROFILE_NAME] = lodash.concat(
    lodash.difference(includedNames[CONFIG_PROFILE_NAME], appProfiles), appProfiles);

  let appSandboxes = standardizeNames(ctx, appOptions.privateSandbox || appOptions.privateSandboxes);
  includedNames[CONFIG_SANDBOX_NAME] = lodash.concat(
    lodash.difference(includedNames[CONFIG_SANDBOX_NAME], appSandboxes), appSandboxes);

  let appTextures = standardizeNames(ctx, appOptions.privateTexture || appOptions.privateTextures);
  includedNames[CONFIG_TEXTURE_NAME] = lodash.concat(
    lodash.difference(includedNames[CONFIG_TEXTURE_NAME], appTextures), appTextures);

  return includedNames;
}

function loadConfigOfModules(ctx, config, ALIASES_OF, includedNames, libRefs, defaultConfigDir, externalConfigDir) {
  let {L, T} = ctx;
  CONFIG_TYPES.forEach(function(configType) {
    config[configType] = config[configType] || {};

    L.has('dunce') && L.log('dunce', T.toMessage({
      text: ' + load the default config from plugins & framework'
    }));
    lodash.forEach(libRefs, function(libRef) {
      if (libRef.presets && chores.isUpgradeSupported('presets')) {
        L.has('dunce') && L.log('dunce', T.add(libRef).toMessage({
          text: ' - Presets of ${type}[${name}]: ${presets}'
        }));
      }
      let libRootDir = libRef.path;
      let libType = libRef.type || 'plugin';
      let libName = libRef.name;
      for(let i in ALIASES_OF[configType]) {
        let defaultFile = path.join(libRootDir, CONFIG_SUBDIR, ALIASES_OF[configType][i] + '.js');
        if (chores.fileExists(defaultFile)) {
          config[configType]['default'] = lodash.defaultsDeep(config[configType]['default'],
              transformConfig(ctx, configType, loadConfigFile(ctx, defaultFile), libType, libName, libRef.presets));
          break;
        }
      }
    });

    config[configType]['names'] = ['default'];
    config[configType]['mixture'] = {};

    loadApplicationConfig(ctx, config, ALIASES_OF, includedNames, configType, defaultConfigDir);
    if (externalConfigDir != defaultConfigDir) {
      loadApplicationConfig(ctx, config, ALIASES_OF, includedNames, configType, externalConfigDir);
    }

    L.has('dunce') && L.log('dunce', ' - Final config object: %s', util.inspect(config[configType], {depth: 8}));
  });
}

function loadApplicationConfig(ctx, config, ALIASES_OF, includedNames, configType, configDir) {
  let {L, T} = ctx;
  if (configDir) {
    L.has('dunce') && L.log('dunce', T.add({ configType, configDir }).toMessage({
      text: ' + load the "${configType}" configuration in "${configDir}"'
    }));
    let configFiles = chores.filterFiles(configDir, '.*\.js');
    let configInfos = lodash.map(configFiles, function(file) {
      if (false) {
        return file.replace('.js', '').split(/_(.+)/).filter(function(sub) {
          return sub.length > 0;
        });
      }
      return file.replace('.js', '').replace(/[_]/,'&').split('&');
    });
    L.has('dunce') && L.log('dunce', T.add({ configInfos }).toMessage({
      text: ' - parsing configFiles result: ${configInfos}'
    }));

    L.has('dunce') && L.log('dunce', T.add({ configType }).toMessage({
      text: ' - load the application default config of "${configType}"'
    }));
    for(let i in ALIASES_OF[configType]) {
      let defaultFile = path.join(configDir, ALIASES_OF[configType][i] + '.js');
      if (chores.fileExists(defaultFile)) {
        config[configType]['expanse'] = transformConfig(ctx, configType, loadConfigFile(ctx, defaultFile), 'application');
        break;
      }
    }
    config[configType]['default'] = lodash.defaultsDeep({}, config[configType]['expanse'], config[configType]['default']);

    L.has('dunce') && L.log('dunce', T.add({ configType }).toMessage({
      text: ' - load the application customized config of "${configType}"'
    }));
    let expanseNames = filterConfigBy(ctx, configInfos, includedNames, configType, ALIASES_OF);
    L.has('dunce') && L.log('dunce', T.add({ expanseNames }).toMessage({
      text: ' + expanded names: ${expanseNames}'
    }));
    config[configType]['expanse'] = config[configType]['expanse'] || {};
    config[configType]['expanse'] = lodash.reduce(expanseNames, function(accum, expanseItem) {
      let configFile = path.join(configDir, expanseItem.join('_') + '.js');
      let configObj = lodash.defaultsDeep(transformConfig(ctx, configType, loadConfigFile(ctx, configFile), 'application'), accum);
      if (configObj.disabled) return accum;
      config[configType]['names'].push(expanseItem[1]);
      return configObj;
    }, config[configType]['expanse']);
    config[configType]['mixture'] = config[configType]['mixture'] || {};
    config[configType]['mixture'] = lodash.defaultsDeep(config[configType]['expanse'], config[configType]['mixture'], config[configType]['default']);
  }
}

let loadConfigFile = function(ctx, configFile) {
  let { L, T, issueInspector } = ctx || this;
  let opStatus = { type: 'CONFIG', file: configFile };
  let content;
  try {
    L.has('dunce') && L.log('dunce', T.add({ configFile }).toMessage({
      text: ' - load config file: "${configFile}"'
    }));
    content = loader(configFile, { stopWhenError: true });
    opStatus.hasError = false;
    L.has('dunce') && L.log('dunce', T.add({ configFile }).toMessage({
      text: ' - loading config file: "${configFile}" has done.'
    }));
  } catch(err) {
    if (err.code != 'MODULE_NOT_FOUND') {
      L.has('dunce') && L.log('dunce', T.add({ configFile }).toMessage({
        text: ' - config file ${configFile} loading is failed.'
      }));
      opStatus.hasError = true;
      opStatus.stack = err.stack;
    }
  }
  issueInspector.collect(opStatus);
  return RELOADING_FORCED ? lodash.cloneDeep(content) : content;
}

let filterConfigBy = function(ctx, configInfos, selectedNames, configType, aliasesOf) {
  let arr = {};
  let idx = {};
  selectedNames[configType].forEach(function(name, index) {
    idx[name] = index;
  });
  lodash.forEach(configInfos, function(item) {
    let found = (item.length == 2) && (aliasesOf[configType].indexOf(item[0]) >= 0) && (item[1].length > 0);
    if (found && idx[item[1]] != null) {
      arr[idx[item[1]]] = item;
    }
  });
  return lodash.values(arr);
}

let resolveConfigDir = function(ctx, appName, appRootDir, configDir, configEnv) {
  let { L, T, issueInspector } = ctx || this;
  let dirPath = configDir;
  if (lodash.isEmpty(dirPath)) {
    if (['production'].indexOf(process.env.NODE_ENV) >= 0) {
      dirPath = chores.assertDir(appName);
      if (dirPath == null) {
        L.has('dunce') && L.log('dunce', T.toMessage({
          text: 'Run in production mode, but config directory not found'
        }));
        issueInspector.exit(1);
      }
    } else {
      if (!lodash.isEmpty(appRootDir)) {
        dirPath = path.join(appRootDir, CONFIG_SUBDIR);
      }
    }
  }
  if (!lodash.isEmpty(dirPath) && !lodash.isEmpty(configEnv)) {
    dirPath = path.join(dirPath, configEnv);
  }
  return dirPath;
}

let standardizeNames = function(ctx, cfgLabels) {
  if (lodash.isString(cfgLabels) && cfgLabels.length > 0) {
    cfgLabels = cfgLabels.split(',');
  }
  cfgLabels = nodash.arrayify(cfgLabels);
  cfgLabels = lodash.filter(cfgLabels, lodash.isString);
  cfgLabels = lodash.map(cfgLabels, lodash.trim);
  cfgLabels = lodash.filter(cfgLabels, lodash.negate(lodash.isEmpty));
  return cfgLabels;
}

let transformConfig = function(ctx, configType, configData, moduleType, moduleName, modulePresets) {
  let { L, T, nameResolver, CONFIG_SANDBOX_NAME } = ctx || this;
  if (configType === CONFIG_SANDBOX_NAME) {
    configData = convertPreciseConfig(ctx, configData, moduleType, moduleName, modulePresets);
    if (chores.isUpgradeSupported(['simplify-name-resolver'])) {
      configData = applyAliasMap(ctx, configData, nameResolver.getOriginalNameOf);
    } else {
      // @Deprecated
      let {pluginAliasMap, bridgeAliasMap} = ctx;
      configData = doAliasMap(ctx, configData, pluginAliasMap, bridgeAliasMap);
    }
  }
  return configData;
}

let convertPreciseConfig = function(ctx, preciseConfig, moduleType, moduleName, modulePresets) {
  let { L, T } = ctx || this;
  if (lodash.isEmpty(preciseConfig) || !lodash.isObject(preciseConfig)) {
    return preciseConfig;
  }
  // convert old bridge structures
  if (chores.isUpgradeSupported(['bridge-full-ref','presets'])) {
    let tags = nodash.arrayify(lodash.get(modulePresets, ['configTags'], []));
    let cfgBridges = preciseConfig.bridges;
    let loadable = RELOADING_FORCED || !(cfgBridges && cfgBridges.__status__);
    if (lodash.isObject(cfgBridges) && tags.indexOf('bridge[dialect-bridge]') >= 0 && loadable) {
      let newBridges = RELOADING_FORCED ? {} : { __status__: true };
      let traverseBackward = function(cfgBridges, newBridges) {
        lodash.forOwn(cfgBridges, function(bridgeCfg, cfgName) {
          if (lodash.isObject(bridgeCfg) && !lodash.isEmpty(bridgeCfg)) {
            if (moduleType === 'application') {
              newBridges[cfgName] = newBridges[cfgName] || {};
              lodash.merge(newBridges[cfgName], bridgeCfg);
            } else
            if (moduleType === 'plugin') {
              moduleName = moduleName || '*';
              let bridgeNames = lodash.keys(bridgeCfg);
              if (bridgeNames.length === 1) {
                let bridgeName = bridgeNames[0];
                newBridges[bridgeName] = newBridges[bridgeName] || {};
                newBridges[bridgeName][moduleName] = newBridges[bridgeName][moduleName] || {};
                if (lodash.isObject(bridgeCfg[bridgeName])) {
                  newBridges[bridgeName][moduleName][cfgName] = bridgeCfg[bridgeName];
                }
              }
            }
          }
        });
      }
      traverseBackward(cfgBridges, newBridges);
      preciseConfig.bridges = newBridges;
    }
  }
  return preciseConfig;
}

let applyAliasMap = function(ctx, preciseConfig, nameTransformer) {
  let { L, T } = ctx || this;
  if (chores.isUpgradeSupported(['standardizing-config'])) {
    if (preciseConfig && lodash.isObject(preciseConfig.plugins)) {
      let oldPlugins = preciseConfig.plugins;
      let newPlugins = {};
      lodash.forOwn(oldPlugins, function(oldPlugin, oldPluginName) {
        let newPluginName = nameTransformer(oldPluginName, 'plugin');
        newPlugins[newPluginName] = oldPlugin;
      });
      preciseConfig.plugins = newPlugins;
    }
  }
  if (chores.isUpgradeSupported(['standardizing-config', 'bridge-full-ref'])) {
    if (preciseConfig && lodash.isObject(preciseConfig.bridges)) {
      let oldBridges = preciseConfig.bridges;
      let newBridges = {};
      lodash.forOwn(oldBridges, function(oldBridge, oldBridgeName) {
        let newBridgeName = nameTransformer(oldBridgeName, 'bridge');
        if (newBridgeName) {
          if (lodash.isObject(oldBridge)) {
            newBridges[newBridgeName] = {};
            lodash.forOwn(oldBridge, function(oldPlugin, oldPluginName) {
              let newPluginName = nameTransformer(oldPluginName, 'plugin');
              newBridges[newBridgeName][newPluginName] = oldPlugin;
            });
          } else {
            newBridges[newBridgeName] = oldBridge;
          }
        }
      });
      preciseConfig.bridges = newBridges;
    }
  }
  return preciseConfig;
}

let doAliasMap = null;
if (!chores.isUpgradeSupported(['simplify-name-resolver'])) {
  doAliasMap = function(ctx, preciseConfig, pluginAliasMap, bridgeAliasMap) {
    function nameTransformer(name, type) {
      switch(type) {
        case 'plugin':
          return pluginAliasMap[name] || name;
        case 'bridge':
          return bridgeAliasMap[name] || name;
      }
      return name;
    }
    return applyAliasMap(ctx, preciseConfig, nameTransformer);
  }
}
