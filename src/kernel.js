'use strict';

const Injektor = require('injektor');
const lodash = require('lodash');
const path = require('path');
const util = require('util');
const chores = require('./utils/chores');
const constx = require('./utils/constx');
const LoggingWrapper = require('./backbone/logging-wrapper');
const blockRef = chores.getBlockRef(__filename);

const CONSTRUCTORS = {};
chores.loadServiceByNames(CONSTRUCTORS, path.join(__dirname, 'backbone'), [
  'sandbox-manager', 'schema-validator', 'script-executor', 'script-renderer',
  'security-manager', 'bridge-loader', 'plugin-loader',
  'object-decorator', 'logging-factory', 'process-manager',
]);

function Kernel(params = {}) {
  const loggingWrapper = new LoggingWrapper(blockRef);
  const L = loggingWrapper.getLogger();
  const T = loggingWrapper.getTracer();

  L.has('silly') && L.log('silly', T.toMessage({
    tags: [ blockRef, 'constructor-begin' ],
    text: ' + constructor start ...'
  }));

  // init the default parameters
  const { configObject, manifestHandler, contextManager, issueInspector, stateInspector, nameResolver } = params;

  // create injektor instance
  const injektor = new Injektor(chores.injektorOptions);

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

  if (chores.isUpgradeSupported('metadata-refiner')) {
    const CTX = { SELECTED_FIELDS: manifestHandler.SELECTED_FIELDS };

    // validate bridge's configures
    const bridgeLoader = injektor.lookup('bridgeLoader', chores.injektorContext);
    const bridgeMetadata = bridgeLoader.loadMetadata();
    L.has('silly') && L.log('silly', T.add({ metadata: bridgeMetadata }).toMessage({
      tags: [ blockRef, 'bridge-config-schema-input' ],
      text: " - bridge's metadata: ${metadata}"
    }));
    const bridgeSchema = extractBridgeSchema(CTX, bridgeMetadata);

    // validate plugin's configures
    const pluginLoader = injektor.lookup('pluginLoader', chores.injektorContext);
    const pluginMetadata = pluginLoader.loadMetadata();
    L.has('silly') && L.log('silly', T.add({ metadata: pluginMetadata }).toMessage({
      tags: [ blockRef, 'plugin-config-schema-input' ],
      text: " - plugin's metadata: ${metadata}"
    }));
    const pluginSchema = extractPluginSchema(CTX, pluginMetadata);

    const result = manifestHandler.validateConfig(configObject, bridgeSchema, pluginSchema);
    issueInspector.collect(result).barrier({ invoker: blockRef, footmark: 'metadata-validating' });
  }

  if (chores.isUpgradeSupported('manifest-refiner')) {
    const result = manifestHandler.validateConfig(configObject);
    issueInspector.collect(result).barrier({ invoker: blockRef, footmark: 'metadata-validating' });
  }

  // initialize plugins, bridges, sandboxManager
  const sandboxManager = injektor.lookup('sandboxManager', chores.injektorContext);

  const profileConfig = injektor.lookup('profileConfig', chores.injektorContext);
  const frameworkCfg = profileConfig[constx.FRAMEWORK.NAME] || {};
  const inOpts = lodash.assign({ invoker: blockRef, footmark: 'sandbox-loading' }, frameworkCfg);
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

function extractBridgeSchema(ref, bridgeMetadata) {
  const { SELECTED_FIELDS } = ref;
  const bridgeSchema = {};
  lodash.forOwn(bridgeMetadata, function(metadata, bridgeCode) {
    bridgeSchema[bridgeCode] = lodash.pick(metadata, SELECTED_FIELDS);
  });
  return bridgeSchema;
}

//-----------------------------------------------------------------------------

function extractPluginSchema(ref, pluginMetadata) {
  const { SELECTED_FIELDS } = ref;
  const pluginSchema = {};
  pluginSchema.profile = pluginSchema.profile || {};
  pluginSchema.sandbox = pluginSchema.sandbox || {};
  lodash.forOwn(pluginMetadata, function(metainf, key) {
    const def = metainf && metainf.default || {};
    if (def.pluginCode && ['profile', 'sandbox'].indexOf(def.type) >= 0) {
      if (chores.isSpecialPlugin(def.pluginCode)) {
        pluginSchema[def.type][def.pluginCode] = lodash.pick(def, SELECTED_FIELDS);
      } else {
        pluginSchema[def.type]['plugins'] = pluginSchema[def.type]['plugins'] || {};
        pluginSchema[def.type]['plugins'][def.pluginCode] = lodash.pick(def, SELECTED_FIELDS);
      }
    }
  });
  return pluginSchema;
}
