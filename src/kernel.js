'use strict';

const Injektor = require('injektor');
const lodash = require('lodash');
const path = require('path');
const chores = require('./utils/chores');
const constx = require('./utils/constx');
const LoggingWrapper = require('./backbone/logging-wrapper');
const blockRef = chores.getBlockRef(__filename);

let CONSTRUCTORS = {};
chores.loadServiceByNames(CONSTRUCTORS, path.join(__dirname, 'backbone'), [
  'sandbox-manager', 'schema-validator', 'script-executor', 'script-renderer',
  'security-manager', 'bridge-loader', 'plugin-loader', 'logging-factory', 'process-manager'
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
    .registerObject('sandboxNames', configObject['sandbox']['names'], chores.injektorContext)
    .registerObject('sandboxConfig', configObject['sandbox']['mixture'], chores.injektorContext)
    .registerObject('profileNames', configObject['profile']['names'], chores.injektorContext)
    .registerObject('profileConfig', configObject['profile']['mixture'], chores.injektorContext)
    .registerObject('contextManager', contextManager, chores.injektorContext)
    .registerObject('issueInspector', issueInspector, chores.injektorContext)
    .registerObject('nameResolver', nameResolver, chores.injektorContext);

  lodash.forOwn(CONSTRUCTORS, function(constructor, serviceName) {
    injektor.defineService(serviceName, constructor, chores.injektorContext);
  });

  let schemaValidator = injektor.lookup('schemaValidator', chores.injektorContext);
  let result = [];
  let CTX = {L, T, schemaValidator};

  // validate bridge's configures
  let bridgeLoader = injektor.lookup('bridgeLoader', chores.injektorContext);
  let bridgeMetadata = {};
  bridgeLoader.loadMetadata(bridgeMetadata);

  L.has('silly') && L.log('silly', T.add({ metadata: bridgeMetadata }).toMessage({
    tags: [ blockRef, 'bridge-config-schema-input' ],
    text: " - bridge's metadata: ${metadata}"
  }));

  // apply 'schemaValidation' option from presets for bridges
  lodash.forEach(configObject.bridgeRefs, function(bridgeRef) {
    let bridgeCode = nameResolver.getDefaultAlias(bridgeRef);
    if (bridgeRef.presets && bridgeRef.presets.schemaValidation === false) {
      lodash.set(bridgeMetadata, [bridgeCode, 'metadata', 'enabled'], false);
    }
  });

  let bridgeConfig = lodash.get(configObject, ['sandbox', 'mixture', 'bridges'], {});

  validateBridgeConfig(CTX, bridgeConfig, bridgeMetadata, result);

  // validate plugin's configures
  let pluginLoader = injektor.lookup('pluginLoader', chores.injektorContext);
  let pluginMetadata = {};
  pluginLoader.loadMetadata(pluginMetadata);

  L.has('silly') && L.log('silly', T.add({ metadata: pluginMetadata }).toMessage({
    tags: [ blockRef, 'plugin-config-schema-input' ],
    text: " - plugin's metadata: ${metadata}"
  }));

  let SELECTED_FIELDS = [ 'crateScope', 'extension', 'schema', 'validator' ];
  let extractPluginSchema = function(pluginMetadata) {
    let configSchema = { profile: {}, sandbox: {} };
    lodash.forOwn(pluginMetadata, function(ref, key) {
      let def = ref && ref.default || {};
      if (def.pluginCode && ['profile', 'sandbox'].indexOf(def.type) >= 0) {
        if (chores.isSpecialPlugin(def.pluginCode)) {
          configSchema[def.type][def.pluginCode] = lodash.pick(def, SELECTED_FIELDS);
        } else {
          configSchema[def.type]['plugins'] = configSchema[def.type]['plugins'] || {};
          configSchema[def.type]['plugins'][def.pluginCode] = lodash.pick(def, SELECTED_FIELDS);
        }
      }
    });
    return configSchema;
  }
  let pluginSchema = extractPluginSchema(pluginMetadata);

  // apply 'schemaValidation' option from presets for plugins
  lodash.forEach(configObject.pluginRefs, function(pluginRef) {
    let pluginCode = nameResolver.getDefaultAlias(pluginRef);
    if (pluginRef.presets && pluginRef.presets.schemaValidation === false) {
      if (!chores.isSpecialPlugin(pluginCode)) {
        lodash.forEach(['profile', 'sandbox'], function(configType) {
          lodash.set(pluginSchema, [configType, 'plugins', pluginCode, 'enabled'], false);
        });
      }
    }
  });

  let pluginConfig = {
    profile: lodash.get(configObject, ['profile', 'mixture'], {}),
    sandbox: lodash.pick(lodash.get(configObject, ['sandbox', 'mixture'], {}), ['application', 'plugins'])
  }

  L.has('silly') && L.log('silly', T.add({ pluginConfig, pluginSchema }).toMessage({
    tags: [ blockRef, 'validate-plugin-config-by-schema' ],
    text: ' - Synchronize the structure of configuration data and schemas'
  }));

  validatePluginConfig(CTX, pluginConfig, pluginSchema, result);

  // summarize validating result
  L.has('silly') && L.log('silly', T.add({ result }).toMessage({
    tags: [ blockRef, 'validating-config-by-schema-result' ],
    text: ' - Validating sandbox configuration using schemas'
  }));

  issueInspector.collect(result).barrier({ invoker: blockRef, footmark: 'metadata-validating' });

  // initialize plugins, bridges, sandboxManager
  let sandboxManager = injektor.lookup('sandboxManager', chores.injektorContext);

  let devebotCfg = lodash.get(configObject, ['profile', 'mixture', constx.FRAMEWORK.NAME], {});
  let inOpts = lodash.assign({ invoker: blockRef, footmark: 'sandbox-loading' }, devebotCfg);
  issueInspector.barrier(inOpts);
  stateInspector.conclude(inOpts);

  this.invoke = function(block) {
    return lodash.isFunction(block) && Promise.resolve().then(function() {
      return block(injektor);
    });
  }

  let profileConfig = injektor.lookup('profileConfig', chores.injektorContext);
  let frameworkCfg = profileConfig[constx.FRAMEWORK.NAME] || {};
  if (frameworkCfg.coupling === 'loose') {
    let sandboxManager = injektor.lookup('sandboxManager', chores.injektorContext);
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

let validateBridgeConfig = function(ctx, bridgeConfig, bridgeSchema, result) {
  let { L, T, schemaValidator } = ctx;
  result = result || [];

  bridgeConfig = bridgeConfig || {};
  bridgeSchema = bridgeSchema || {};

  L.has('silly') && L.log('silly', T.add({ bridgeConfig, bridgeSchema }).toMessage({
    tags: [ blockRef, 'validate-bridge-config-by-schema' ],
    text: ' - bridge config/schema:\n${bridgeSchema}\n${bridgeConfig}'
  }));

  let customizeResult = function(result, bridgeCode, pluginName, dialectName) {
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
        let bridgeMetadata = lodash.get(bridgeSchema, [bridgeCode, 'metadata'], null) || {};
        let dialectSchema = lodash.get(bridgeMetadata, ['schema'], null);
        if (bridgeMetadata.enabled === false || lodash.isNull(dialectSchema)) continue;
        let dialectConfig = dialectMap[bridgeCode] || {};
        let r = schemaValidator.validate(dialectConfig, dialectSchema);
        result.push(customizeResult(r, bridgeCode, '*', dialectName));
      }
    }
    return result;
  }

  for(let bridgeCode in bridgeConfig) {
    let bridgeMap = bridgeConfig[bridgeCode] || {};
    let bridgeMetadata = lodash.get(bridgeSchema, [bridgeCode, 'metadata'], null) || {};
    let dialectSchema = lodash.get(bridgeMetadata, ['schema'], null);
    if (bridgeMetadata.enabled === false || lodash.isNull(dialectSchema)) continue;
    for(let pluginName in bridgeMap) {
      let pluginMap = bridgeMap[pluginName] || {};
      for(let dialectName in pluginMap) {
        let dialectConfig = pluginMap[dialectName] || {};
        let r = schemaValidator.validate(dialectConfig, dialectSchema);
        result.push(customizeResult(r, bridgeCode, pluginName, dialectName));
      }
    }
  }

  return result;
}

let validatePluginConfig = function(ctx, pluginConfig, pluginSchema, result) {
  let { L, T, schemaValidator } = ctx;
  result = result || [];

  let customizeResult = function(result, crateScope, crateName) {
    result = (result == undefined || result == null) ? false : result;
    result = (typeof result === 'boolean') ? { ok: result } : result;
    let output = {};
    output.stage = 'config/schema';
    output.name = crateScope;
    output.type = chores.isSpecialPlugin(crateName) ? crateName : 'plugin';
    output.hasError = result.ok !== true;
    if (!result.ok && result.errors) {
      output.stack = JSON.stringify(result.errors, null, 2);
    }
    return output;
  }

  let validateSandboxOfCrate = function(result, crateConfig, crateSchema, crateName) {
    let validated = false;
    if (crateSchema && crateSchema.enabled !== false) {
      if (lodash.isObject(crateSchema.schema)) {
        let r = schemaValidator.validate(crateConfig, crateSchema.schema);
        result.push(customizeResult(r, crateSchema.crateScope, crateName));
        validated = true;
      }
      if (lodash.isFunction(crateSchema.validator)) {
        let r = crateSchema.validator(crateConfig);
        result.push(customizeResult(r, crateSchema.crateScope, crateName));
        validated = true;
      }
    }
    if (!validated) {
      L.has('silly') && L.log('silly', T.add({ crateName, crateConfig, crateSchema }).toMessage({
        tags: [ blockRef, 'validate-plugin-config-by-schema-skipped' ],
        text: ' - Validating sandboxConfig[${crateName}] is skipped'
      }));
    }
  }

  let validateSandboxOfCrates = function(sandboxConfig, sandboxSchema) {
    sandboxConfig = sandboxConfig || {};
    sandboxSchema = sandboxSchema || {};
    if (sandboxConfig.application) {
      validateSandboxOfCrate(result, sandboxConfig.application, sandboxSchema.application, 'application');
    }
    if (sandboxConfig.plugins) {
      lodash.forOwn(sandboxConfig.plugins, function(pluginObject, pluginName) {
        if (lodash.isObject(sandboxSchema.plugins)) {
          validateSandboxOfCrate(result, pluginObject, sandboxSchema.plugins[pluginName], pluginName);
        }
      });
    }
  }

  validateSandboxOfCrates(pluginConfig.sandbox, pluginSchema.sandbox);
}