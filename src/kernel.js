'use strict';

const Injektor = require('injektor');
const lodash = require('lodash');
const path = require('path');
const util = require('util');
const chores = require('./utils/chores');
const constx = require('./utils/constx');
const LoggingWrapper = require('./backbone/logging-wrapper');
const blockRef = chores.getBlockRef(__filename);

let CONSTRUCTORS = {};
chores.loadServiceByNames(CONSTRUCTORS, path.join(__dirname, 'backbone'), [
  'sandbox-manager', 'schema-validator', 'script-executor', 'script-renderer',
  'security-manager', 'bridge-loader', 'plugin-loader',
  'object-decorator', 'logging-factory', 'process-manager',
]);

function Kernel(params={}) {
  let loggingWrapper = new LoggingWrapper(blockRef);
  let L = loggingWrapper.getLogger();
  let T = loggingWrapper.getTracer();

  L.has('silly') && L.log('silly', T.toMessage({
    tags: [ blockRef, 'constructor-begin' ],
    text: ' + constructor start ...'
  }));

  // init the default parameters
  let { configObject, contextManager, issueInspector, stateInspector, nameResolver } = params || {};

  // create injektor instance
  let injektor = new Injektor(chores.injektorOptions);

  ['appName', 'appInfo', 'bridgeRefs', 'pluginRefs'].forEach(function(refName) {
    injektor.registerObject(refName, configObject[refName], chores.injektorContext);
  });

  injektor
    .registerObject('contextManager', contextManager, chores.injektorContext)
    .registerObject('issueInspector', issueInspector, chores.injektorContext)
    .registerObject('nameResolver', nameResolver, chores.injektorContext)
    .registerObject('profileNames', configObject['profile']['names'], chores.injektorContext)
    .registerObject('profileConfig', configObject['profile']['mixture'], chores.injektorContext)
    .registerObject('sandboxNames', configObject['sandbox']['names'], chores.injektorContext)
    .registerObject('sandboxConfig', configObject['sandbox']['mixture'], chores.injektorContext)
    .registerObject('textureNames', configObject['texture']['names'], chores.injektorContext)
    .registerObject('textureConfig', configObject['texture']['mixture'], chores.injektorContext);

  lodash.forOwn(CONSTRUCTORS, function(constructor, serviceName) {
    injektor.defineService(serviceName, constructor, chores.injektorContext);
  });

  if (chores.isUpgradeSupported(['manifest-refiner'], ['metadata-refiner'])) {
    let schemaValidator = injektor.lookup('schemaValidator', chores.injektorContext);
    let CTX = {L, T, nameResolver, schemaValidator};
    let result = [];

    // validate bridge's configures
    let bridgeMetadata = null;
    if (chores.isUpgradeSupported(['metadata-refiner'])) {
      let bridgeLoader = injektor.lookup('bridgeLoader', chores.injektorContext);
      bridgeMetadata = bridgeLoader.loadMetadata();
      L.has('silly') && L.log('silly', T.add({ metadata: bridgeMetadata }).toMessage({
        tags: [ blockRef, 'bridge-config-schema-input' ],
        text: " - bridge's metadata: ${metadata}"
      }));
    }

    let bridgeSchema = extractBridgeSchema(CTX, configObject.bridgeRefs, bridgeMetadata);

    let bridgeConfig = lodash.get(configObject, ['sandbox', 'mixture', 'bridges'], {});

    validateBridgeConfig(CTX, bridgeConfig, bridgeSchema, result);

    // validate plugin's configures
    let pluginMetadata = null;
    if (chores.isUpgradeSupported(['metadata-refiner'])) {
      let pluginLoader = injektor.lookup('pluginLoader', chores.injektorContext);
      pluginMetadata = pluginLoader.loadMetadata();
      L.has('silly') && L.log('silly', T.add({ metadata: pluginMetadata }).toMessage({
        tags: [ blockRef, 'plugin-config-schema-input' ],
        text: " - plugin's metadata: ${metadata}"
      }));
    }

    let pluginSchema = extractPluginSchema(CTX, configObject.pluginRefs, pluginMetadata);

    let pluginConfig = {
      profile: lodash.get(configObject, ['profile', 'mixture'], {}),
      sandbox: lodash.pick(lodash.get(configObject, ['sandbox', 'mixture'], {}), ['application', 'plugins'])
    }

    validatePluginConfig(CTX, pluginConfig, pluginSchema, result);

    // summarize validating result
    L.has('silly') && L.log('silly', T.add({ result }).toMessage({
      tags: [ blockRef, 'validating-config-by-schema-result' ],
      text: ' - Validating sandbox configuration using schemas'
    }));

    issueInspector.collect(result).barrier({ invoker: blockRef, footmark: 'metadata-validating' });
  }

  // initialize plugins, bridges, sandboxManager
  let sandboxManager = injektor.lookup('sandboxManager', chores.injektorContext);

  let profileConfig = injektor.lookup('profileConfig', chores.injektorContext);
  let frameworkCfg = profileConfig[constx.FRAMEWORK.NAME] || {};
  let inOpts = lodash.assign({ invoker: blockRef, footmark: 'sandbox-loading' }, frameworkCfg);
  issueInspector.barrier(inOpts);
  stateInspector.conclude(inOpts);

  this.invoke = function(block) {
    return lodash.isFunction(block) && Promise.resolve().then(function() {
      return block(injektor);
    });
  }

  if (frameworkCfg.coupling === 'loose') {
    this.getSandboxManager = function() {
      return sandboxManager;
    }
    this.getSandboxService = function(serviceName, context) {
      return sandboxManager.getSandboxService(serviceName, context);
    }
  }

  this._injektor = injektor;

  L.has('silly') && L.log('silly', T.toMessage({
    tags: [ blockRef, 'constructor-end' ],
    text: ' - constructor has finished'
  }));
}

module.exports = Kernel;

//-----------------------------------------------------------------------------

let extractBridgeSchema = function(ref, bridgeRefs, bridgeMetadata, bridgeSchema) {
  const { nameResolver } = ref;
  bridgeSchema = bridgeSchema || {};
  if (!chores.isUpgradeSupported(['manifest-refiner'])) {
    lodash.forOwn(bridgeMetadata, function(metadata, bridgeCode) {
      bridgeSchema[bridgeCode] = lodash.pick(metadata, SELECTED_FIELDS);
    });
  }
  lodash.forEach(bridgeRefs, function(bridgeRef) {
    let bridgeCode = nameResolver.getDefaultAliasOf(bridgeRef.name, bridgeRef.type);
    if (!chores.isUpgradeSupported(['improving-name-resolver'])) {
      bridgeCode = nameResolver.getDefaultAlias(bridgeRef);
    }
    if (chores.isUpgradeSupported(['manifest-refiner'])) {
      const validationBlock = lodash.get(bridgeRef, ['manifest', 'validation']);
      if (lodash.isObject(validationBlock)) {
        bridgeSchema[bridgeCode] = lodash.pick(validationBlock, SELECTED_FIELDS);
      }
    }
    // apply 'schemaValidation' option from presets for bridges
    bridgeSchema[bridgeCode] = bridgeSchema[bridgeCode] || {};
    if (bridgeRef.presets && bridgeRef.presets.schemaValidation === false) {
      lodash.set(bridgeSchema, [bridgeCode, 'enabled'], false);
    }
  });
  return bridgeSchema;
}

let validateBridgeConfig = function(ref, bridgeConfig, bridgeSchema, result) {
  let { L, T, schemaValidator } = ref;
  result = result || [];

  bridgeConfig = bridgeConfig || {};
  bridgeSchema = bridgeSchema || {};

  L.has('silly') && L.log('silly', T.add({ bridgeConfig, bridgeSchema }).toMessage({
    tags: [ blockRef, 'validate-bridge-config-by-schema' ],
    text: ' - bridge config/schema:\n${bridgeSchema}\n${bridgeConfig}'
  }));

  let customizeBridgeResult = function(result, bridgeCode, pluginName, dialectName) {
    let output = {};
    output.stage = 'config/schema';
    output.name = [pluginName, chores.getSeparator(), bridgeCode, '#', dialectName].join('');
    output.type = 'bridge';
    output.hasError = result.ok !== true;
    if (!result.ok && result.errors) {
      output.stack = JSON.stringify(result.errors, null, 2);
    }
    return output;
  }

  if (!chores.isUpgradeSupported('bridge-full-ref')) {
    for(let dialectName in bridgeConfig) {
      let dialectMap = bridgeConfig[dialectName] || {};
      for(let bridgeCode in dialectMap) {
        let bridgeMetadata = lodash.get(bridgeSchema, [bridgeCode], {});
        if (bridgeMetadata.enabled === false || !lodash.isObject(bridgeMetadata.schema)) continue;
        let dialectConfig = dialectMap[bridgeCode] || {};
        let r = schemaValidator.validate(dialectConfig, bridgeMetadata.schema);
        result.push(customizeBridgeResult(r, bridgeCode, '*', dialectName));
      }
    }
    return result;
  }

  for(let bridgeCode in bridgeConfig) {
    let bridgeMap = bridgeConfig[bridgeCode] || {};
    let bridgeMetadata = lodash.get(bridgeSchema, [bridgeCode], {});
    if (bridgeMetadata.enabled === false || !lodash.isObject(bridgeMetadata.schema)) continue;
    for(let pluginName in bridgeMap) {
      let pluginMap = bridgeMap[pluginName] || {};
      for(let dialectName in pluginMap) {
        let dialectConfig = pluginMap[dialectName] || {};
        let r = schemaValidator.validate(dialectConfig, bridgeMetadata.schema);
        result.push(customizeBridgeResult(r, bridgeCode, pluginName, dialectName));
      }
    }
  }

  return result;
}

//-----------------------------------------------------------------------------

const SELECTED_FIELDS = [ 'crateScope', 'extension', 'schema', 'checkConstraints' ];

let extractPluginSchema = function(ref, pluginRefs, pluginMetadata, pluginSchema) {
  let { L, T, nameResolver } = ref;
  pluginSchema = pluginSchema || {};
  pluginSchema.profile = pluginSchema.profile || {};
  pluginSchema.sandbox = pluginSchema.sandbox || {};
  if (!chores.isUpgradeSupported(['manifest-refiner'])) {
    lodash.forOwn(pluginMetadata, function(metainf, key) {
      let def = metainf && metainf.default || {};
      if (def.pluginCode && ['profile', 'sandbox'].indexOf(def.type) >= 0) {
        if (chores.isSpecialPlugin(def.pluginCode)) {
          pluginSchema[def.type][def.pluginCode] = lodash.pick(def, SELECTED_FIELDS);
        } else {
          pluginSchema[def.type]['plugins'] = pluginSchema[def.type]['plugins'] || {};
          pluginSchema[def.type]['plugins'][def.pluginCode] = lodash.pick(def, SELECTED_FIELDS);
        }
      }
    });
  }
  lodash.forEach(pluginRefs, function(pluginRef) {
    let pluginCode = nameResolver.getDefaultAliasOf(pluginRef.name, pluginRef.type);
    if (!chores.isUpgradeSupported('improving-name-resolver')) {
      pluginCode = nameResolver.getDefaultAlias(pluginRef);
    }
    if (chores.isUpgradeSupported(['manifest-refiner'])) {
      const configType = 'sandbox';
      let validationBlock = lodash.get(pluginRef, ['manifest', configType, 'validation']);
      if (lodash.isObject(validationBlock)) {
        validationBlock = lodash.pick(validationBlock, SELECTED_FIELDS);
        validationBlock.crateScope = nameResolver.getOriginalNameOf(pluginRef.name, pluginRef.type);
        if (chores.isSpecialPlugin(pluginCode)) {
          pluginSchema[configType][pluginCode] = validationBlock;
        } else {
          pluginSchema[configType]['plugins'] = pluginSchema[configType]['plugins'] || {};
          pluginSchema[configType]['plugins'][pluginCode] = validationBlock;
        }
      }
    }
    // apply 'schemaValidation' option from presets for plugins
    if (pluginRef.presets && pluginRef.presets.schemaValidation === false) {
      if (!chores.isSpecialPlugin(pluginCode)) {
        lodash.forEach(['profile', 'sandbox'], function(configType) {
          lodash.set(pluginSchema, [configType, 'plugins', pluginCode, 'enabled'], false);
        });
      }
    }
    // apply 'pluginDepends' & 'bridgeDepends' to pluginSchema
    lodash.forEach(['bridgeDepends', 'pluginDepends'], function(depType) {
      if (lodash.isArray(pluginRef[depType])) {
        lodash.set(pluginSchema, ['sandbox', 'plugins', pluginCode, depType], pluginRef[depType]);
      }
    });
  });
  return pluginSchema;
}

let validatePluginConfig = function(ref, pluginConfig, pluginSchema, result) {
  const { L, T } = ref;
  L.has('silly') && L.log('silly', T.add({ pluginConfig, pluginSchema }).toMessage({
    tags: [ blockRef, 'validate-plugin-config-by-schema' ],
    text: ' - Synchronize the structure of configuration data and schemas'
  }));
  result = result || [];
  validateSandboxSchemaOfCrates(ref, result, pluginConfig.sandbox, pluginSchema.sandbox);
  checkSandboxConstraintsOfCrates(ref, result, pluginConfig.sandbox, pluginSchema.sandbox);
}

let validateSandboxSchemaOfCrates = function(ref, result, config, schema) {
  const { L, T } = ref;
  config = config || {};
  schema = schema || {};
  if (config.application) {
    validateSandboxSchemaOfCrate(ref, result, config.application, schema.application, 'application');
  }
  if (config.plugins) {
    lodash.forOwn(config.plugins, function(pluginObject, pluginName) {
      if (lodash.isObject(schema.plugins)) {
        validateSandboxSchemaOfCrate(ref, result, pluginObject, schema.plugins[pluginName], pluginName);
      }
    });
  }
}

let validateSandboxSchemaOfCrate = function(ref, result, crateConfig, crateSchema, crateName) {
  const { L, T, schemaValidator } = ref;
  if (crateSchema && crateSchema.enabled !== false && lodash.isObject(crateSchema.schema)) {
    let r = schemaValidator.validate(crateConfig, crateSchema.schema);
    result.push(customizeSandboxResult(r, crateSchema.crateScope, 'schema'));
  } else {
    L.has('silly') && L.log('silly', T.add({ crateName, crateConfig, crateSchema }).toMessage({
      tags: [ blockRef, 'validate-plugin-config-by-schema-skipped' ],
      text: ' - Validating sandboxConfig[${crateName}] is skipped'
    }));
  }
}

let checkSandboxConstraintsOfCrates = function(ref, result, config, schema) {
  const { L, T } = ref;
  config = config || {};
  schema = schema || {};
  if (lodash.isObject(config.application)) {
    checkSandboxConstraintsOfAppbox(ref, result, config, schema);
  }
  if (lodash.isObject(config.plugins)) {
    lodash.forOwn(config.plugins, function(pluginObject, pluginName) {
      checkSandboxConstraintsOfPlugin(ref, result, config, schema, pluginName);
    });
  }
}

let checkSandboxConstraintsOfAppbox = function(ref, result, config, schema) {
  let { L, T } = ref;
  let crateName = 'application';
  let crateConfig = config.application;
  let crateSchema = schema.application;
  let checkConstraints = crateSchema && crateSchema.checkConstraints;
  if (lodash.isFunction(checkConstraints)) {
    let extractedCfg = { plugins: {}, bridges: {} };
    extractedCfg.application = crateConfig;
    let pluginDepends = crateSchema.pluginDepends || [];
    lodash.forEach(pluginDepends, function(depName) {
      extractedCfg.plugins[depName] = config.plugins[depName];
    });
    let bridgeDepends = crateSchema.bridgeDepends || [];
    lodash.forEach(bridgeDepends, function(depName) {
      extractedCfg.bridges[depName] = lodash.get(config, ["bridges", depName, "application"]);
    });
    let r = null;
    try {
      r = checkConstraints(extractedCfg);
    } catch (error) {
      r = { ok: false, reason: 'application.checkConstraints() raises an error' }
    }
    result.push(customizeSandboxResult(r, crateSchema.crateScope, 'constraints'));
  }
}

let checkSandboxConstraintsOfPlugin = function(ref, result, config, schema, crateName) {
  let { L, T } = ref;
  let crateConfig = config.plugins[crateName];
  let crateSchema = schema && schema.plugins && schema.plugins[crateName];
  let checkConstraints = crateSchema && crateSchema.checkConstraints;
  if (lodash.isFunction(checkConstraints)) {
    let extractedCfg = { plugins: {}, bridges: {} };
    extractedCfg.plugins[crateName] = crateConfig;
    let pluginDepends = crateSchema.pluginDepends || [];
    lodash.forEach(pluginDepends, function(depName) {
      if (depName === crateName) {
        let r = { ok: false, reason: {
          pluginName: crateName,
          message: 'plugin depends on itself'
        } };
        result.push(customizeSandboxResult(r, crateSchema.crateScope, 'constraints'));
      }
      extractedCfg.plugins[depName] = config.plugins[depName];
    });
    let bridgeDepends = crateSchema.bridgeDepends || [];
    lodash.forEach(bridgeDepends, function(depName) {
      extractedCfg.bridges[depName] = lodash.get(config, ["bridges", depName, crateName]);
    });
    let r = null;
    try {
      r = checkConstraints(extractedCfg);
    } catch (error) {
      r = {
        ok: false,
        reason: util.format('plugins[%s].checkConstraints() raises an error', crateName)
      }
    }
    result.push(customizeSandboxResult(r, crateSchema.crateScope, 'constraints'));
  }
}

let customizeSandboxResult = function(result, crateScope, validationType) {
  result = (result == undefined || result == null) ? false : result;
  result = (typeof result === 'boolean') ? { ok: result } : result;
  let output = {};
  output.stage = 'config/' + validationType;
  output.name = crateScope;
  output.type = chores.isSpecialPlugin(crateScope) ? crateScope : 'plugin';
  output.hasError = result.ok !== true;
  if (!result.ok) {
    if (result.errors) {
      output.stack = JSON.stringify(result.errors, null, 2);
    }
    if (result.reason) {
      output.stack = result.reason;
    }
  }
  return output;
}
