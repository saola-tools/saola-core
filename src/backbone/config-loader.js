"use strict";

const assert = require("assert");
const lodash = require("lodash");
const util = require("util");
const path = require("path");
const chores = require("../utils/chores");
const constx = require("../utils/constx");
const loader = require("../utils/loader");
const envbox = require("../utils/envbox");
const envcfg = require("../utils/envcfg");
const nodash = require("../utils/nodash");
const LoggingWrapper = require("./logging-wrapper");
const blockRef = chores.getBlockRef(__filename);

const FRAMEWORK_NAMESPACE_UCASE = lodash.toUpper(constx.FRAMEWORK.NAMESPACE);
const FRAMEWORK_BRIDGE_LABEL = "bridge";
const FRAMEWORK_PLUGIN_LABEL = "plugin";
const FILE_JS_FILTER_PATTERN = constx.FILE.JS_FILTER_PATTERN;

const CONFIG_SUBDIR = "/config";
const CONFIG_VAR_NAMES = [ "PROFILE", "SANDBOX", "TEXTURE", "CONFIG_DIR", "CONFIG_ENV" ];
const CONFIG_PROFILE_NAME = "profile";
const CONFIG_SANDBOX_NAME = "sandbox";
const CONFIG_TEXTURE_NAME = "texture";
const CONFIG_TYPES = [CONFIG_PROFILE_NAME, CONFIG_SANDBOX_NAME, CONFIG_TEXTURE_NAME];
const CONFIG_METADATA_BLOCK = "__manifest__";
const RELOADING_FORCED = true;

function ConfigLoader (params = {}) {
  const { options, appRef, frameworkRef, pluginRefs, bridgeRefs } = params;
  const { issueInspector, stateInspector, nameResolver, manifestHandler } = params;
  const loggingWrapper = new LoggingWrapper(blockRef);
  const L = loggingWrapper.getLogger();
  const T = loggingWrapper.getTracer();
  const CTX = { L, T, issueInspector, stateInspector, nameResolver, manifestHandler };
  const appName = appRef && appRef.name;
  const label = chores.stringLabelCase(appName);

  L && L.has("silly") && L.log("silly", T && T.add({ appName, label }).toMessage({
    tags: [ blockRef, "constructor-begin" ],
    text: " + Config of application (${appName}) is loaded in name: ${label}"
  }));

  this.load = function() {
    const configObject = loadConfig.bind(null, CTX, appName, options, appRef, frameworkRef, pluginRefs, bridgeRefs)
        .apply(null, CONFIG_VAR_NAMES.map(readVariable.bind(null, CTX, label)));
    if (chores.isUpgradeSupported("manifest-refiner")) {
      if (manifestHandler) {
        const result = manifestHandler.validateConfig(configObject);
        issueInspector.collect(result).barrier({ invoker: blockRef, footmark: "metadata-validating" });
      }
    }
    return configObject;
  };

  L && L.has("silly") && L.log("silly", T && T.toMessage({
    tags: [ blockRef, "constructor-end" ],
    text: " - constructor has finished"
  }));
}

module.exports = ConfigLoader;

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ private members

function readVariable (ctx, appLabel, varName) {
  const { L, T } = ctx || this || {};
  const labels = [
    util.format("%s_%s", appLabel, varName),
    util.format("%s_%s", FRAMEWORK_NAMESPACE_UCASE, varName),
    util.format("NODE_%s_%s", appLabel, varName),
    util.format("NODE_%s_%s", FRAMEWORK_NAMESPACE_UCASE, varName)
  ];
  for (const label of labels) {
    const value = envbox.getEnv(label);
    if (value) {
      L && L.has("dunce") && L.log("dunce", T && T.add({ label: labels[0], value }).toMessage({
        text: " - Final value of ${label}: ${value}"
      }));
      return value;
    }
  }
  return undefined;
}

function loadConfig (ctx, appName, options, appRef, frameworkRef, pluginRefs, bridgeRefs, profileName, sandboxName, textureName, customDir, customEnv) {
  const { L, T, issueInspector, stateInspector, nameResolver } = ctx || this || {};

  assert.ok(nameResolver);
  assert.ok(issueInspector);
  assert.ok(stateInspector);

  const aliasesOf = buildConfigTypeAliases();
  L && L.has("silly") && L.log("silly", T && T.add({ aliasesOf }).toMessage({
    tags: [ blockRef, "config-dir", "aliases-of" ],
    text: " - configType aliases mapping: ${aliasesOf}"
  }));

  const config = {};

  const tileNames = buildConfigTileNames(ctx, options, profileName, sandboxName, textureName);
  L && L.has("dunce") && L.log("dunce", T && T.add({ tileNames }).toMessage({
    text: " + included names: ${tileNames}"
  }));

  loadConfigOfModules(ctx, config, aliasesOf, tileNames, appName, appRef, frameworkRef, pluginRefs, bridgeRefs, customDir, customEnv);

  fillConfigByEnvVars(ctx, config, appName);

  lodash.forEach([CONFIG_SANDBOX_NAME, CONFIG_TEXTURE_NAME], function(configType) {
    if (chores.isUpgradeSupported("standardizing-config")) {
      applyAliasMap(ctx, config[configType].initial, nameResolver.getDefaultAliasOf);
      applyAliasMap(ctx, config[configType].default, nameResolver.getDefaultAliasOf);
      applyAliasMap(ctx, config[configType].expanse, nameResolver.getDefaultAliasOf);
      applyAliasMap(ctx, config[configType].mixture, nameResolver.getDefaultAliasOf);
      if (!chores.isUpgradeSupported("simplify-name-resolver")) {
        const {plugin: pluginReverseMap, bridge: bridgeReverseMap} = nameResolver.getRelativeAliasMap();
        doAliasMap(ctx, config[configType].initial, pluginReverseMap, bridgeReverseMap);
        doAliasMap(ctx, config[configType].default, pluginReverseMap, bridgeReverseMap);
        doAliasMap(ctx, config[configType].expanse, pluginReverseMap, bridgeReverseMap);
        doAliasMap(ctx, config[configType].mixture, pluginReverseMap, bridgeReverseMap);
      }
      stateInspector.collect({config});
    }
  });

  issueInspector.barrier({ invoker: blockRef, footmark: "config-file-loading" });

  return config;
}

function buildConfigTypeAliases () {
  const ALIASES_OF = {};
  ALIASES_OF[CONFIG_PROFILE_NAME] = lodash.clone(envbox.getEnv("CONFIG_PROFILE_ALIASES"));
  ALIASES_OF[CONFIG_PROFILE_NAME].unshift(CONFIG_PROFILE_NAME);
  ALIASES_OF[CONFIG_SANDBOX_NAME] = lodash.clone(envbox.getEnv("CONFIG_SANDBOX_ALIASES"));
  ALIASES_OF[CONFIG_SANDBOX_NAME].unshift(CONFIG_SANDBOX_NAME);
  ALIASES_OF[CONFIG_TEXTURE_NAME] = lodash.clone(envbox.getEnv("CONFIG_TEXTURE_ALIASES"));
  ALIASES_OF[CONFIG_TEXTURE_NAME].unshift(CONFIG_TEXTURE_NAME);
  return ALIASES_OF;
}

function buildConfigTileNames (ctx, options = {}, profileName, sandboxName, textureName) {
  const tileNames = {};
  tileNames[CONFIG_PROFILE_NAME] = standardizeNames(ctx, profileName);
  tileNames[CONFIG_SANDBOX_NAME] = standardizeNames(ctx, sandboxName);
  tileNames[CONFIG_TEXTURE_NAME] = standardizeNames(ctx, textureName);

  const appProfiles = standardizeNames(ctx, options.privateProfile || options.privateProfiles);
  tileNames[CONFIG_PROFILE_NAME] = lodash.concat(
    lodash.difference(tileNames[CONFIG_PROFILE_NAME], appProfiles), appProfiles);

  const appSandboxes = standardizeNames(ctx, options.privateSandbox || options.privateSandboxes);
  tileNames[CONFIG_SANDBOX_NAME] = lodash.concat(
    lodash.difference(tileNames[CONFIG_SANDBOX_NAME], appSandboxes), appSandboxes);

  const appTextures = standardizeNames(ctx, options.privateTexture || options.privateTextures);
  tileNames[CONFIG_TEXTURE_NAME] = lodash.concat(
    lodash.difference(tileNames[CONFIG_TEXTURE_NAME], appTextures), appTextures);

  return tileNames;
}

function loadConfigOfModules (ctx, config, aliasesOf, tileNames, appName, appRef, frameworkRef, pluginRefs, bridgeRefs, customDir, customEnv) {
  const { L, T } = ctx || this || {};

  const libRefs = lodash.values(pluginRefs);
  if (frameworkRef) {
    libRefs.push(frameworkRef);
  }

  const bundleRefs = {};
  if (appRef && appRef.path) bundleRefs[appRef.path] = appRef;
  lodash.assign(bundleRefs, pluginRefs);
  if (frameworkRef && frameworkRef.path) bundleRefs[frameworkRef.path] = frameworkRef;

  let bridgeManifests = extractConfigManifest(ctx, bridgeRefs);
  let pluginManifests = extractConfigManifest(ctx, bundleRefs);
  if (!chores.isUpgradeSupported("manifest-refiner")) {
    bridgeManifests = pluginManifests = undefined;
  }

  const appRootDir = appRef && lodash.isString(appRef.path) ? appRef.path : null;

  const defaultConfigDir = appRootDir ? path.join(appRootDir, CONFIG_SUBDIR) : null;
  L && L.has("silly") && L.log("silly", T && T.add({ configDir: defaultConfigDir }).toMessage({
    tags: [ blockRef, "config-dir", "internal-config-dir" ],
    text: " - internal configDir: ${configDir}"
  }));

  const externalConfigDir = resolveConfigDir(ctx, appName, appRootDir, customDir, customEnv);
  L && L.has("silly") && L.log("silly", T && T.add({ configDir: externalConfigDir }).toMessage({
    tags: [ blockRef, "config-dir", "external-config-dir" ],
    text: " - external configDir: ${configDir}"
  }));

  CONFIG_TYPES.forEach(function(configType) {
    config[configType] = config[configType] || {};

    L && L.has("dunce") && L.log("dunce", T && T.toMessage({
      text: " + load the default config from plugins & framework"
    }));
    lodash.forEach(libRefs, function(libRef) {
      if (libRef.presets && chores.isUpgradeSupported("presets")) {
        L && L.has("dunce") && L.log("dunce", T && T.add(libRef).toMessage({
          text: " - Presets of ${type}[${name}]: ${presets}"
        }));
      }
      const libRootDir = libRef.path;
      for (const i in aliasesOf[configType]) {
        const defaultFile = path.join(libRootDir, CONFIG_SUBDIR, aliasesOf[configType][i] + ".js");
        if (chores.fileExists(defaultFile)) {
          config[configType]["initial"] = lodash.defaultsDeep(config[configType]["initial"],
              standardizeConfig(ctx, configType, loadConfigFile(ctx, defaultFile), libRef, bridgeManifests, pluginManifests));
          config[configType]["default"] = lodash.cloneDeep(config[configType]["initial"]);
          break;
        }
      }
    });

    config[configType]["names"] = ["default"];
    config[configType]["mixture"] = {};

    loadAppboxConfig(ctx, config, aliasesOf, tileNames, appRef, bridgeManifests, pluginManifests, configType, defaultConfigDir);
    if (externalConfigDir != defaultConfigDir) {
      loadAppboxConfig(ctx, config, aliasesOf, tileNames, appRef, bridgeManifests, pluginManifests, configType, externalConfigDir);
    }

    L && L.has("dunce") && L.log("dunce", T && T.toMessage({
      text: " - Final config object: " + util.inspect(config[configType], {depth: 8})
    }));
  });
}

function extractConfigManifest (ctx, moduleRefs, configManifest) {
  const { nameResolver } = ctx || this || {};

  assert.ok(nameResolver);

  configManifest = configManifest || {};
  lodash.forOwn(moduleRefs, function(moduleRef) {
    let moduleName = nameResolver.getOriginalNameOf(moduleRef.name, moduleRef.type);
    if (!chores.isUpgradeSupported("refining-name-resolver")) {
      moduleName = nameResolver.getOriginalName(moduleRef);
    }
    configManifest[moduleName] = lodash.pick(moduleRef, ["version", "manifest"]);
  });
  return configManifest;
}

function fillConfigByEnvVars (ctx, config = {}, appName) {
  const appLabel = chores.stringLabelCase(appName);
  const { store, paths } = extractEnvironConfig(ctx, appLabel);
  const clone = {};
  for (const location of paths) {
    if (!lodash.isArray(location)) {
      continue;
    }
    if (location.length < 2) {
      continue;
    }
    const configType = location[0];
    if (CONFIG_TYPES.indexOf(configType) < 0) {
      continue;
    }

    let newVal;
    const envVal = lodash.get(store, location);
    const oldVal = lodash.get(config, [configType, "mixture"].concat(location.slice(1)));
    if (lodash.isNumber(oldVal)) {
      newVal = Number(envVal);
      if (Number.isNaN(newVal)) {
        newVal = null;
      }
    } else
    if (lodash.isBoolean(oldVal)) {
      newVal = envVal.toLowerCase() == "true" ? true : false;
    } else
    if (lodash.isString(oldVal)) {
      newVal = envVal;
    }

    if (!lodash.isNil(newVal)) {
      lodash.set(clone, location, newVal);
    }
  }

  CONFIG_TYPES.forEach(function(configType) {
    config[configType] = config[configType] || {};
    if (configType in clone && !lodash.isEmpty(clone[configType])) {
      config[configType]["environ"] = clone[configType];
      config[configType]["mixture"] = lodash.merge(config[configType]["mixture"], config[configType]["environ"]);
    }
  });
}

function extractEnvironConfig (ctx, appLabel) {
  const prefixes = [
    util.format("%s_CONFIG_VAL", appLabel),
    util.format("%s_CONFIG_VAL", FRAMEWORK_NAMESPACE_UCASE),
    util.format("NODE_%s_CONFIG_VAL", appLabel),
    util.format("NODE_%s_CONFIG_VAL", FRAMEWORK_NAMESPACE_UCASE),
  ];

  let result = {};
  for (const prefix of prefixes) {
    result = envcfg.extractEnv(prefix, result);
  }

  return result;
}

function loadAppboxConfig (ctx, config, aliasesOf, tileNames, appRef, bridgeManifests, pluginManifests, configType, configDir) {
  const { L, T } = ctx || this || {};
  if (configDir) {
    L && L.has("dunce") && L.log("dunce", T && T.add({ configType, configDir }).toMessage({
      text: " + load the '${configType}' configuration in '${configDir}'"
    }));
    const configFiles = chores.filterFiles(configDir, FILE_JS_FILTER_PATTERN);
    const configInfos = lodash.map(configFiles, function(file) {
      if (constx.LOADING.SPLITTING_FILENAME_BY_REGEXP) {
        return file.replace(".js", "").split(/_(.+)/).filter(function(sub) {
          return sub.length > 0;
        });
      }
      return file.replace(".js", "").replace(/[_]/, "&").split("&");
    });
    L && L.has("dunce") && L.log("dunce", T && T.add({ configInfos }).toMessage({
      text: " - parsing configFiles result: ${configInfos}"
    }));

    L && L.has("dunce") && L.log("dunce", T && T.add({ configType }).toMessage({
      text: " - load the application default config of '${configType}'"
    }));
    for (const i in aliasesOf[configType]) {
      const defaultFile = path.join(configDir, aliasesOf[configType][i] + ".js");
      if (chores.fileExists(defaultFile)) {
        config[configType]["expanse"] = standardizeConfig(ctx, configType, loadConfigFile(ctx, defaultFile), appRef, bridgeManifests, pluginManifests);
        break;
      }
    }
    config[configType]["default"] = lodash.defaultsDeep({}, config[configType]["expanse"], config[configType]["default"]);

    L && L.has("dunce") && L.log("dunce", T && T.add({ configType }).toMessage({
      text: " - load the application customized config of '${configType}'"
    }));
    const expanseNames = filterConfigBy(ctx, configInfos, tileNames, configType, aliasesOf);
    L && L.has("dunce") && L.log("dunce", T && T.add({ expanseNames }).toMessage({
      text: " + expanded names: ${expanseNames}"
    }));
    config[configType]["expanse"] = config[configType]["expanse"] || {};
    config[configType]["expanse"] = lodash.reduce(expanseNames, function(accum, expanseItem) {
      const configFile = path.join(configDir, expanseItem.join("_") + ".js");
      const configObj = lodash.defaultsDeep(standardizeConfig(ctx, configType, loadConfigFile(ctx, configFile), appRef, bridgeManifests, pluginManifests), accum);
      if (configObj.disabled) return accum;
      config[configType]["names"].push(expanseItem[1]);
      return configObj;
    }, config[configType]["expanse"]);
    config[configType]["mixture"] = config[configType]["mixture"] || {};
    config[configType]["mixture"] = lodash.defaultsDeep(config[configType]["expanse"], config[configType]["mixture"], config[configType]["default"]);
  }
}

function loadConfigFile (ctx, configFile) {
  const { L, T, issueInspector } = ctx || this || {};
  const opStatus = { type: "CONFIG", file: configFile };
  let content;
  try {
    L && L.has("dunce") && L.log("dunce", T && T.add({ configFile }).toMessage({
      text: " - load config file: '${configFile}'"
    }));
    content = loader(configFile, { stopWhenError: true });
    opStatus.hasError = false;
    L && L.has("dunce") && L.log("dunce", T && T.add({ configFile }).toMessage({
      text: " - loading config file: '${configFile}' has done."
    }));
  } catch (err) {
    if (err.code !== "MODULE_NOT_FOUND") {
      L && L.has("dunce") && L.log("dunce", T && T.add({ configFile }).toMessage({
        text: " - config file ${configFile} loading is failed."
      }));
      opStatus.hasError = true;
      opStatus.stack = err.stack;
    }
  }
  issueInspector && issueInspector.collect(opStatus);
  return RELOADING_FORCED ? lodash.cloneDeep(content) : content;
}

function filterConfigBy (ctx, configInfos, selectedNames, configType, aliasesOf) {
  const arr = {};
  const idx = {};
  selectedNames[configType].forEach(function(name, index) {
    idx[name] = index;
  });
  lodash.forEach(configInfos, function(item) {
    const found = (item.length === 2) && (aliasesOf[configType].indexOf(item[0]) >= 0) && (item[1].length > 0);
    if (found && idx[item[1]] != null) {
      arr[idx[item[1]]] = item;
    }
  });
  return lodash.values(arr);
}

function resolveConfigDir (ctx, appName, appRootDir, configDir, configEnv) {
  const { L, T, issueInspector } = ctx || this || {};
  let dirPath = configDir;
  if (lodash.isEmpty(dirPath)) {
    if (["production"].indexOf(process.env.NODE_ENV) >= 0) {
      dirPath = chores.assertDir(appName);
      if (dirPath == null) {
        L && L.has("dunce") && L.log("dunce", T && T.toMessage({
          text: "Run in production mode, but config directory not found"
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

function standardizeNames (ctx, cfgLabels) {
  if (lodash.isString(cfgLabels) && cfgLabels.length > 0) {
    cfgLabels = cfgLabels.split(",");
  }
  cfgLabels = nodash.arrayify(cfgLabels);
  cfgLabels = lodash.filter(cfgLabels, lodash.isString);
  cfgLabels = lodash.map(cfgLabels, lodash.trim);
  cfgLabels = lodash.filter(cfgLabels, lodash.negate(lodash.isEmpty));
  return cfgLabels;
}

function standardizeConfig (ctx, configType, configStore, crateInfo, bridgeManifests, pluginManifests) {
  configStore = transformConfig(ctx, configType, configStore, crateInfo);
  configStore = modernizeConfig(ctx, configType, configStore, crateInfo, bridgeManifests, pluginManifests);
  return configStore;
}

function modernizeConfig (ctx, configType, configStore, crateInfo, bridgeManifests, pluginManifests) {
  if (configType !== CONFIG_SANDBOX_NAME) return configStore;
  if (lodash.isEmpty(configStore)) return configStore;
  const { issueInspector } = ctx || this || {};
  const collector = new ModernizingResultCollector();
  if (!lodash.isEmpty(bridgeManifests)) {
    for (const bridgeName in configStore.bridges) {
      const bridgePath = ["bridges"].concat(bridgeName);
      const bridgeNode = configStore.bridges[bridgeName] || {};
      for (const pluginName in bridgeNode) {
        const pluginPath = bridgePath.concat(pluginName);
        const pluginNode = bridgeNode[pluginName] || {};
        for (const dialectName in pluginNode) {
          const dialectPath = pluginPath.concat(dialectName);
          const r = modernizeConfigBlock(ctx, configStore, dialectPath, bridgeManifests[bridgeName], FRAMEWORK_BRIDGE_LABEL);
          collector.push(r, crateInfo, FRAMEWORK_BRIDGE_LABEL, pluginName, bridgeName, dialectName);
        }
      }
    }
  }
  if (!lodash.isEmpty(pluginManifests)) {
    if (crateInfo.type === "application" && configStore["application"] && pluginManifests["application"]) {
      const r = modernizeConfigBlock(ctx, configStore, ["application"], pluginManifests["application"], "application");
      collector.push(r, crateInfo, "application");
    }
    for (const pluginName in configStore.plugins) {
      const r = modernizeConfigBlock(ctx, configStore, ["plugins", pluginName], pluginManifests[pluginName], FRAMEWORK_PLUGIN_LABEL);
      collector.push(r, crateInfo, FRAMEWORK_PLUGIN_LABEL, pluginName);
    }
  }
  issueInspector && issueInspector.collect(collector.toList());
  return configStore;
}

function modernizeConfigBlock (ctx, configStore, configPath, manifestBlock, moduleType) {
  if (manifestBlock) {
    const moduleVersion = manifestBlock.version;
    if (moduleVersion) {
      const manifestPath = ["manifest", constx.MANIFEST.DEFAULT_ROOT_NAME];
      const manifestObject = lodash.get(manifestBlock, manifestPath);
      return applyManifestMigration(ctx, configStore, configPath, moduleVersion, manifestObject);
    }
  }
  return null;
}

function applyManifestMigration (ctx, configStore, configPath, moduleVersion, manifest) {
  if (manifest && manifest.migration && manifest.enabled !== false) {
    const configNode = lodash.get(configStore, configPath);
    if (lodash.isObject(configNode)) {
      const configVersion = lodash.get(configNode, [CONFIG_METADATA_BLOCK, "version"]);
      if (chores.isVersionLessThan(configVersion, moduleVersion)) {
        const configMeta = lodash.get(configNode, [CONFIG_METADATA_BLOCK]);
        const configData = lodash.omit(configNode, [CONFIG_METADATA_BLOCK]);
        const result = { migrated: false, configVersion, moduleVersion, steps: {} };
        for (const ruleName in manifest.migration) {
          const rule = manifest.migration[ruleName];
          if (rule.enabled === false) {
            result.steps[ruleName] = "disabled";
            continue;
          }
          if (!lodash.isFunction(rule.transform)) {
            result.steps[ruleName] = "not_function";
            continue;
          }
          if (!chores.isVersionSatisfied(configVersion, rule.from)) {
            result.steps[ruleName] = "unmatched";
            continue;
          }
          const transformedData = rule.transform(configData);
          if (lodash.isObject(transformedData)) {
            lodash.set(configMeta, "version", moduleVersion);
            lodash.set(transformedData, CONFIG_METADATA_BLOCK, configMeta);
            lodash.set(configStore, configPath, transformedData);
            result.migrated = true;
            result.ruleName = ruleName;
            result.steps[ruleName] = "ok";
            break;
          } else {
            result.steps[ruleName] = "empty_output";
          }
        }
        return result;
      }
    }
  }
  return null;
}

function ModernizingResultCollector () {
  const collection = [];

  this.push = function(result, crateInfo, moduleType, pluginName, bridgeName, dialectName) {
    const opStatus = { stage: "config/upgrade" };
    opStatus.hasError = (result != null) && (result.migrated !== true);
    opStatus.type = crateInfo.type;
    opStatus.name = crateInfo.name;
    if (opStatus.hasError) {
      const stackText = [];
      switch (moduleType) {
        case FRAMEWORK_BRIDGE_LABEL: {
          stackText.push(util.format("Converting config block for bridge[%s/%s#%s] from [%s] to [%s] has failed",
              pluginName, bridgeName, dialectName, result.configVersion, result.moduleVersion));
          break;
        }
        case FRAMEWORK_PLUGIN_LABEL: {
          stackText.push(util.format("Converting config block for plugin[%s] from [%s] to [%s] has failed",
              pluginName, result.configVersion, result.moduleVersion));
          break;
        }
      }
      lodash.forOwn(result.steps, function(state, ruleName) {
        stackText.push(util.format("- rule[%s]: %s", ruleName, state));
      });
      opStatus.stack = stackText.join("\n  ");
    }
    collection.push(opStatus);
  };

  this.toList = function() {
    return collection;
  };
}

function transformConfig (ctx, configType, configStore, crateInfo) {
  const { nameResolver } = ctx || this || {};
  if (configType === CONFIG_PROFILE_NAME) {
    if (chores.isUpgradeSupported("profile-config-field-framework")) {
      configStore = chores.renameJsonFields(configStore, {
        [constx.LEGACY.PROFILE_CONFIG_FRAMEWORK_FIELD]: "framework"
      });
    }
  }
  if (configType === CONFIG_SANDBOX_NAME) {
    configStore = convertPreciseConfig(ctx, configStore, crateInfo.type, crateInfo.name, crateInfo.presets);
    configStore = applyAliasMap(ctx, configStore, nameResolver.getOriginalNameOf);
    if (!chores.isUpgradeSupported("simplify-name-resolver")) {
      const {plugin: pluginAliasMap, bridge: bridgeAliasMap} = nameResolver.getAbsoluteAliasMap();
      configStore = doAliasMap(ctx, configStore, pluginAliasMap, bridgeAliasMap);
    }
  }
  return configStore;
}

function convertPreciseConfig (ctx, preciseConfig, moduleType, moduleName, modulePresets) {
  if (lodash.isEmpty(preciseConfig) || !lodash.isObject(preciseConfig)) {
    return preciseConfig;
  }
  // convert old bridge structures
  function traverseBackward (cfgBridges, newBridges) {
    lodash.forOwn(cfgBridges, function(bridgeCfg, cfgName) {
      if (lodash.isObject(bridgeCfg) && !lodash.isEmpty(bridgeCfg)) {
        if (moduleType === "application") {
          newBridges[cfgName] = newBridges[cfgName] || {};
          lodash.merge(newBridges[cfgName], bridgeCfg);
        } else
        if (moduleType === FRAMEWORK_PLUGIN_LABEL) {
          moduleName = moduleName || "*";
          const bridgeNames = lodash.keys(bridgeCfg);
          if (bridgeNames.length === 1) {
            const bridgeName = bridgeNames[0];
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
  if (chores.isUpgradeSupported(["bridge-full-ref", "presets"])) {
    const tags = nodash.arrayify(lodash.get(modulePresets, ["configTags"], []));
    const cfgBridges = preciseConfig.bridges;
    const loadable = RELOADING_FORCED || !(cfgBridges && cfgBridges.__status__);
    if (lodash.isObject(cfgBridges) && tags.indexOf("bridge[dialect-bridge]") >= 0 && loadable) {
      const newBridges = RELOADING_FORCED ? {} : { __status__: true };
      traverseBackward(cfgBridges, newBridges);
      preciseConfig.bridges = newBridges;
    }
  }
  return preciseConfig;
}

//-----------------------------------------------------------------------------

let applyAliasMap = function(ctx, preciseConfig, nameTransformer) {
  if (chores.isUpgradeSupported("standardizing-config")) {
    if (preciseConfig && lodash.isObject(preciseConfig.plugins)) {
      const oldPlugins = preciseConfig.plugins;
      const newPlugins = {};
      lodash.forOwn(oldPlugins, function(oldPlugin, oldPluginName) {
        const newPluginName = nameTransformer(oldPluginName, FRAMEWORK_PLUGIN_LABEL);
        newPlugins[newPluginName] = oldPlugin;
      });
      preciseConfig.plugins = newPlugins;
    }
  }
  if (chores.isUpgradeSupported(["standardizing-config", "bridge-full-ref"])) {
    if (preciseConfig && lodash.isObject(preciseConfig.bridges)) {
      const oldBridges = preciseConfig.bridges;
      const newBridges = {};
      lodash.forOwn(oldBridges, function(oldBridge, oldBridgeName) {
        const newBridgeName = nameTransformer(oldBridgeName, FRAMEWORK_BRIDGE_LABEL);
        if (newBridgeName) {
          if (lodash.isObject(oldBridge)) {
            newBridges[newBridgeName] = {};
            lodash.forOwn(oldBridge, function(oldPlugin, oldPluginName) {
              const newPluginName = nameTransformer(oldPluginName, FRAMEWORK_PLUGIN_LABEL);
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
};

let doAliasMap = null;
if (!chores.isUpgradeSupported("simplify-name-resolver")) {
  const applyAliasMapRef = applyAliasMap;
  applyAliasMap = function(ctx, configStore) {
    return configStore;
  };
  doAliasMap = function(ctx, preciseConfig, pluginAliasMap, bridgeAliasMap) {
    function nameTransformer (name, type) {
      switch (type) {
        case FRAMEWORK_PLUGIN_LABEL:
          return pluginAliasMap[name] || name;
        case FRAMEWORK_BRIDGE_LABEL:
          return bridgeAliasMap[name] || name;
      }
      return name;
    }
    return applyAliasMapRef(ctx, preciseConfig, nameTransformer);
  };
}
