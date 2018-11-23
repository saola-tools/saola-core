'use strict';

const lodash = require('lodash');
const loader = require('../utils/loader');
const chores = require('../utils/chores');
const blockRef = chores.getBlockRef(__filename);

function BridgeLoader(params={}) {
  let loggingFactory = params.loggingFactory.branch(blockRef);
  let L = loggingFactory.getLogger();
  let T = loggingFactory.getTracer();
  let CTX = lodash.assign({L, T}, lodash.pick(params, [
    'issueInspector', 'nameResolver', 'objectDecorator'
  ]));

  L.has('silly') && L.log('silly', T.toMessage({
    tags: [ blockRef, 'constructor-begin' ],
    text: ' + constructor start ...'
  }));

  L.has('dunce') && L.log('dunce', T.add(params).toMessage({
    text: ' + bridgeLoader start with bridgeRefs: ${bridgeRefs}'
  }));

  this.loadDialects = function(dialectMap, dialectOptions, optType) {
    dialectMap = dialectMap || {};
    lodash.defaultsDeep(dialectMap, buildBridgeDialects(CTX, params.bridgeRefs, dialectOptions, optType));
    return dialectMap;
  };

  this.loadMetadata = function(metadataMap, dialectOptions) {
    metadataMap = metadataMap || {};
    let bridgeDescriptors = loadBridgeConstructors(CTX, params.bridgeRefs);
    lodash.defaultsDeep(metadataMap, lodash.mapValues(bridgeDescriptors, function(entrypoint) {
      let construktor = lodash.get(entrypoint, "construktor", {});
      return {
        name: entrypoint.name,
        metadata: construktor.devebotMetadata || construktor.metainf || construktor.metadata || null
      }
    }));
    return metadataMap;
  }

  L.has('silly') && L.log('silly', T.toMessage({
    tags: [ blockRef, 'constructor-end' ],
    text: ' - constructor has finished'
  }));
}

BridgeLoader.argumentSchema = {
  "$id": "bridgeLoader",
  "type": "object",
  "properties": {
    "bridgeRefs": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string"
          },
          "path": {
            "type": "string"
          }
        },
        "required": ["name", "path"]
      }
    },
    "issueInspector": {
      "type": "object"
    },
    "nameResolver": {
      "type": "object"
    },
    "loggingFactory": {
      "type": "object"
    },
    "objectDecorator": {
      "type": "object"
    }
  }
};

module.exports = BridgeLoader;

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ private members

let loadBridgeContructor = function(ctx, bridgeRef) {
  let {L, T, issueInspector, nameResolver} = ctx;

  bridgeRef = bridgeRef || {};

  let bridgePath = bridgeRef.path;
  let bridgeName = nameResolver.getOriginalNameOf(bridgeRef.name, bridgeRef.type);
  let bridgeCode = nameResolver.getDefaultAliasOf(bridgeRef.name, bridgeRef.type);
  if (!chores.isUpgradeSupported('improving-name-resolver')) {
    bridgeName = nameResolver.getOriginalName(bridgeRef);
    bridgeCode = nameResolver.getDefaultAlias(bridgeRef);
  }

  L.has('dunce') && L.log('dunce', T.add(bridgeRef).toMessage({
    text: ' - bridge constructor (${name}) loading is started'
  }));

  let result = {};

  if (typeof(bridgeCode) !== 'string') return result;

  let opStatus = lodash.assign({ type: 'DIALECT', code: bridgeCode }, bridgeRef);

  try {
    let bridgeConstructor = loader(bridgePath, { stopWhenError: true });
    L.has('dunce') && L.log('dunce', T.add(bridgeRef).toMessage({
      text: ' - bridge constructor (${name}) loading has done.'
    }));
    if (lodash.isFunction(bridgeConstructor)) {
      result[bridgeCode] = {
        name: bridgeName,
        construktor: bridgeConstructor
      };
      opStatus.hasError = false;
    } else {
      L.has('dunce') && L.log('dunce', T.add(bridgeRef).toMessage({
        text: ' - bridge "${name}" is not a constructor'
      }));
      opStatus.hasError = true;
    }
  } catch(err) {
    L.has('dunce') && L.log('dunce', T.add(bridgeRef).toMessage({
      text: ' - bridge constructor (${name}) loading has failed'
    }));
    opStatus.hasError = true;
    opStatus.stack = err.stack;
  }

  issueInspector.collect(opStatus);

  return result;
};

let loadBridgeConstructors = function(ctx, bridgeRefs) {
  let {L, T} = ctx;

  bridgeRefs = lodash.isArray(bridgeRefs) ? bridgeRefs : [];

  bridgeRefs = lodash.filter(bridgeRefs, function(bridgeRef) {
    return lodash.isString(bridgeRef.name) && lodash.isString(bridgeRef.path);
  });

  L.has('dunce') && L.log('dunce', T.add({ bridgeRefs }).toMessage({
    text: ' - load a list of bridge constructors: ${bridgeRefs}'
  }));

  let bridgeConstructors = {};
  bridgeRefs.forEach(function(bridgeRef) {
    lodash.assign(bridgeConstructors, loadBridgeContructor(ctx, bridgeRef));
  });

  L.has('dunce') && L.log('dunce', T.add({
    bridgeConstructorNames: lodash.keys(bridgeConstructors)
  }).toMessage({
    text: ' - bridge constructors have been loaded: ${bridgeConstructorNames}'
  }));

  return bridgeConstructors;
};

let buildBridgeDialect = function(ctx, dialectOpts) {
  let {L, T, issueInspector, nameResolver, objectDecorator} = ctx;
  let {pluginName, bridgeCode, bridgeRecord, dialectName, optType} = dialectOpts;
  let result = {};

  if (!lodash.isString(bridgeCode)) {
    L.has('dunce') && L.log('dunce', T.toMessage({
      text: ' - bridgeCode is invalid (not a string)'
    }));
    return result;
  } else {
    L.has('dunce') && L.log('dunce', T.add({ dialectOpts }).toMessage({
      text: ' - buildBridgeDialect() with parameters: ${dialectOpts}'
    }));
  }

  dialectName = dialectName || bridgeCode + 'Wrapper';
  L.has('dunce') && L.log('dunce', T.add({ dialectName }).toMessage({
    text: ' - building bridgeDialect (${dialectName}) is started'
  }));

  let crateScope = pluginName;
  let crateName = [bridgeCode, dialectName].join('#');
  let sectorRef = [crateScope, crateName].join(chores.getSeparator());
  let uniqueName = [pluginName, bridgeRecord.name, dialectName].join(chores.getSeparator());
  if (!chores.isUpgradeSupported('bridge-full-ref')) {
    crateScope = bridgeRecord.name;
    crateName = dialectName;
    sectorRef = [crateScope, crateName].join(chores.getSeparator());
    uniqueName = [bridgeRecord.name, dialectName].join(chores.getSeparator());
  }

  let bridgeConstructor = bridgeRecord.construktor;
  if (!lodash.isFunction(bridgeConstructor)) {
    L.has('dunce') && L.log('dunce', T.toMessage({
      text: ' - bridgeConstructor is invalid (not a function)'
    }));
    return result;
  }

  let configPath;
  if (!chores.isUpgradeSupported('bridge-full-ref')) {
    switch(optType) {
      case 0:
        configPath = ['sandboxConfig', 'bridges', dialectName, bridgeCode];
        break;
      case 1:
        configPath = ['sandboxConfig', 'bridges', bridgeCode, dialectName];
        break;
      default:
        configPath = ['sandboxConfig', 'bridges', bridgeCode];
    }
  } else {
    let pluginAlias = pluginName;
    if (chores.isUpgradeSupported('standardizing-config')) {
      pluginAlias = nameResolver.getDefaultAliasOf(pluginName, 'plugin');
    }
    configPath = ['sandboxConfig', 'bridges', bridgeCode, pluginAlias, dialectName];
  }

  L.has('silly') && L.log('silly', T.add({ configPath }).toMessage({
    tags: [ sectorRef, 'config-path' ],
    text: ' - configPath: ${configPath}'
  }));

  function dialectConstructor(kwargs) {
    kwargs = kwargs || {};

    let kwargsRef = null;
    let getWrappedParams = function(kwargs) {
      return kwargsRef = kwargsRef || lodash.clone(kwargs) || {};
    }

    let newFeatures = lodash.get(kwargs, ['profileConfig', 'newFeatures', dialectName], null);
    if (newFeatures === null) {
      newFeatures = lodash.get(kwargs, ['profileConfig', 'newFeatures', bridgeCode], {});
    }

    if (newFeatures.logoliteEnabled !== false) {
      let loggingFactory = kwargs.loggingFactory.branch(sectorRef);
      this.logger = loggingFactory.getLogger();
      this.tracer = loggingFactory.getTracer();
    } else {
      this.logger = kwargs.loggingFactory.getLogger({ sector: sectorRef });
    }

    L.has('silly') && L.log('silly', T.add({ dialectName, newFeatures }).toMessage({
      tags: [ sectorRef, 'apply-features' ],
      text: ' - newFeatures[${dialectName}]: ${newFeatures}'
    }));

    let opStatus = { stage: 'instantiating', type: 'DIALECT', name: dialectName, code: bridgeCode };
    try {
      if (newFeatures.logoliteEnabled !== false) {
        L.has('silly') && L.log('silly', T.toMessage({
          tags: [ sectorRef, 'constructor-begin' ],
          text: ' + constructor start ...'
        }));
      }

      bridgeConstructor.call(this, lodash.get(kwargs, configPath, {}));

      if (newFeatures.logoliteEnabled !== false) {
        L.has('silly') && L.log('silly', T.toMessage({
          tags: [ sectorRef, 'constructor-end' ],
          text: ' - constructor has finished'
        }));
      }
    } catch(err) {
      L.has('silly') && L.log('silly', T.add({ bridgeCode }).toMessage({
        tags: [ sectorRef, 'constructor-failed' ],
        text: ' - bridgeConstructor (${bridgeCode}) call has failed'
      }));
      opStatus.hasError = true;
      opStatus.stack = err.stack;
    }
    issueInspector.collect(opStatus);
  }

  dialectConstructor.prototype = Object.create(bridgeConstructor.prototype);

  dialectConstructor.argumentSchema = {
    "$id": uniqueName,
    "type": "object",
    "properties": {
      "sandboxName": {
        "type": "string"
      },
      "sandboxConfig": {
        "type": "object"
      },
      "profileName": {
        "type": "string"
      },
      "profileConfig": {
        "type": "object"
      },
      "loggingFactory": {
        "type": "object"
      }
    }
  };

  let construktor = objectDecorator.wrapBridgeDialect(dialectConstructor, {
    pluginName: pluginName,
    bridgeCode: bridgeCode,
    dialectName: dialectName
  });

  result[uniqueName] = {
    crateScope: crateScope,
    name: crateName,
    construktor: construktor
  };

  L.has('dunce') && L.log('dunce', T.add({ dialectName }).toMessage({
    text: ' - building bridgeDialect (${dialectName}) has done.'
  }));

  return result;
};

let buildBridgeDialects = function(ctx, bridgeRefs, dialectOptions, optType) {
  let {L, T, nameResolver} = ctx;

  optType = (lodash.isNumber(optType)) ? optType : 0;

  L.has('silly') && L.log('silly', T.add({ bridgeRefs }).toMessage({
    text: ' - bridgeDialects will be built: ${bridgeRefs}'
  }));

  let bridgeConstructors = loadBridgeConstructors(ctx, bridgeRefs);

  if (lodash.isEmpty(dialectOptions)) {
    L.has('silly') && L.log('silly', T.toMessage({
      text: ' - dialectOptions is not provided, nothing is created'
    }));
  } else {
    L.has('silly') && L.log('silly', T.add({ dialectOptions }).toMessage({
      text: ' - dialectInstances will be built with options: ${dialectOptions}'
    }));
  }

  let bridgeDialects = {};
  if (!chores.isUpgradeSupported('bridge-full-ref')) {
    switch(optType) {
      case 0:
        lodash.forOwn(dialectOptions, function(dialectConfig, dialectName) {
          let bridgeCode = lodash.findKey(dialectConfig, function(o, k) {
            return lodash.isObject(o) && bridgeConstructors[k];
          });
          if (bridgeCode) {
            lodash.assign(bridgeDialects, buildBridgeDialect(ctx, {
              bridgeCode,
              bridgeRecord: bridgeConstructors[bridgeCode],
              dialectName,
              optType
            }));
          }
        });
        break;
      case 1:
        lodash.forOwn(dialectOptions, function(dialectMap, bridgeCode) {
          lodash.forOwn(dialectMap, function(dialectConfig, dialectName) {
            lodash.assign(bridgeDialects, buildBridgeDialect(ctx, {
              bridgeCode,
              bridgeRecord: bridgeConstructors[bridgeCode],
              dialectName,
              optType}));
          });
        });
        break;
      default:
        lodash.forOwn(dialectOptions, function(bridgeConfig, bridgeCode) {
          lodash.assign(bridgeDialects, buildBridgeDialect(ctx, {
            bridgeCode,
            bridgeRecord: bridgeConstructors[bridgeCode],
            dialectName: bridgeCode + 'Wrapper',
            optType
          }));
        });
    }
  } else {
    lodash.forOwn(dialectOptions, function(bridgeMap, bridgeCode) {
      if (!bridgeCode || !bridgeConstructors[bridgeCode]) return;
      lodash.forOwn(bridgeMap, function(pluginMap, pluginName) {
        pluginName = nameResolver.getOriginalNameOf(pluginName, 'plugin');
        lodash.forOwn(pluginMap, function(dialectConfig, dialectName) {
          lodash.assign(bridgeDialects, buildBridgeDialect(ctx, {
            pluginName,
            bridgeCode,
            bridgeRecord: bridgeConstructors[bridgeCode],
            dialectName,
            optType
          }));
        });
      });
    });
  }

  L.has('silly') && L.log('silly', T.add({
    bridgeDialectNames: lodash.keys(bridgeDialects)
  }).toMessage({
    text: ' - bridgeDialects have been built: ${bridgeDialectNames}'
  }));

  return bridgeDialects;
};

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ private members
