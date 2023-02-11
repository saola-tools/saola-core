"use strict";

const lodash = require("lodash");
const util = require("util");
const loader = require("../utils/loader");
const chores = require("../utils/chores");
const blockRef = chores.getBlockRef(__filename);

const FRAMEWORK_PLUGIN_LABEL = "plugin";

function BridgeLoader (params = {}) {
  const loggingFactory = params.loggingFactory.branch(blockRef);
  const L = loggingFactory.getLogger();
  const T = loggingFactory.getTracer();
  const CTX = lodash.assign({L, T}, lodash.pick(params, [
    "issueInspector", "nameResolver", "objectDecorator"
  ]));

  L && L.has("silly") && L.log("silly", T && T.toMessage({
    tags: [ blockRef, "constructor-begin" ],
    text: " + constructor start ..."
  }));

  L && L.has("dunce") && L.log("dunce", T && T.add(params).toMessage({
    text: " + bridgeLoader start with bridgeList: ${bridgeList}"
  }));

  this.loadDialects = function(dialectMap, dialectOptions, optType) {
    dialectMap = dialectMap || {};
    lodash.defaultsDeep(dialectMap, buildBridgeDialects(CTX, params.bridgeList, dialectOptions, optType));
    return dialectMap;
  };

  this.loadMetadata = function(metadataMap, dialectOptions) {
    metadataMap = metadataMap || {};
    const bridgeDescriptors = loadBridgeConstructors(CTX, params.bridgeList);
    lodash.defaultsDeep(metadataMap, lodash.mapValues(bridgeDescriptors, function(entrypoint) {
      const construktor = lodash.get(entrypoint, "construktor", {});
      const metadata = construktor.metadata || construktor.metainfo || construktor.metainf || {};
      metadata.name = entrypoint.name;
      return metadata;
    }));
    return metadataMap;
  };

  L && L.has("silly") && L.log("silly", T && T.toMessage({
    tags: [ blockRef, "constructor-end" ],
    text: " - constructor has finished"
  }));
}

BridgeLoader.argumentSchema = {
  "$id": "bridgeLoader",
  "type": "object",
  "properties": {
    "bridgeList": {
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

function loadBridgeContructor (ctx, bridgeRef) {
  const {L, T, issueInspector, nameResolver} = ctx || this || {};

  bridgeRef = bridgeRef || {};

  const bridgePath = bridgeRef.path;
  let bridgeName = nameResolver.getOriginalNameOf(bridgeRef.name, bridgeRef.type);
  let bridgeCode = nameResolver.getDefaultAliasOf(bridgeRef.name, bridgeRef.type);
  if (!chores.isUpgradeSupported("refining-name-resolver")) {
    bridgeName = nameResolver.getOriginalName(bridgeRef);
    bridgeCode = nameResolver.getDefaultAlias(bridgeRef);
  }

  L && L.has("dunce") && L.log("dunce", T && T.add(bridgeRef).toMessage({
    text: " - bridge constructor (${name}) loading is started"
  }));

  const result = {};

  if (typeof(bridgeCode) !== "string") return result;

  const opStatus = lodash.assign({ type: "DIALECT", code: bridgeCode }, bridgeRef);

  try {
    const bridgeConstructor = loader(bridgePath, { stopWhenError: true });
    L && L.has("dunce") && L.log("dunce", T && T.add(bridgeRef).toMessage({
      text: " - bridge constructor (${name}) loading has done."
    }));
    if (lodash.isFunction(bridgeConstructor)) {
      result[bridgeCode] = {
        name: bridgeName,
        construktor: bridgeConstructor
      };
      opStatus.hasError = false;
    } else {
      L && L.has("dunce") && L.log("dunce", T && T.add(bridgeRef).toMessage({
        text: " - bridge '${name}' is not a constructor"
      }));
      opStatus.hasError = true;
    }
  } catch (err) {
    L && L.has("dunce") && L.log("dunce", T && T.add(bridgeRef).toMessage({
      text: " - bridge constructor (${name}) loading has failed"
    }));
    opStatus.hasError = true;
    opStatus.stack = err.stack;
  }

  issueInspector.collect(opStatus);

  return result;
};

function loadBridgeConstructors (ctx, bridgeList) {
  const {L, T} = ctx || this || {};

  bridgeList = lodash.isArray(bridgeList) ? bridgeList : [];

  bridgeList = lodash.filter(bridgeList, function(bridgeRef) {
    return lodash.isString(bridgeRef.name) && lodash.isString(bridgeRef.path);
  });

  L && L.has("dunce") && L.log("dunce", T && T.add({ bridgeList }).toMessage({
    text: " - load a list of bridge constructors: ${bridgeList}"
  }));

  const bridgeConstructors = {};
  bridgeList.forEach(function(bridgeRef) {
    lodash.assign(bridgeConstructors, loadBridgeContructor(ctx, bridgeRef));
  });

  L && L.has("dunce") && L.log("dunce", T && T.add({
    bridgeConstructorNames: lodash.keys(bridgeConstructors)
  }).toMessage({
    text: " - bridge constructors have been loaded: ${bridgeConstructorNames}"
  }));

  return bridgeConstructors;
};

function buildBridgeDialect (ctx, dialectOpts) {
  const {L, T, issueInspector, nameResolver, objectDecorator} = ctx || this || {};
  const {pluginName, bridgeCode, bridgeRecord, optType} = dialectOpts;
  const result = {};

  if (!lodash.isString(bridgeCode)) {
    L && L.has("dunce") && L.log("dunce", T && T.toMessage({
      text: " - bridgeCode is invalid (not a string)"
    }));
    return result;
  } else {
    L && L.has("dunce") && L.log("dunce", T && T.add({ dialectOpts }).toMessage({
      text: " - buildBridgeDialect() with parameters: ${dialectOpts}"
    }));
  }

  const dialectName = lodash.get(dialectOpts, "dialectName", bridgeCode + "Wrapper");
  L && L.has("dunce") && L.log("dunce", T && T.add({ dialectName }).toMessage({
    text: " - building bridgeDialect (${dialectName}) is started"
  }));

  let crateScope = pluginName;
  let crateName = [bridgeCode, dialectName].join("#");
  let sectorRef = [crateScope, crateName].join(chores.getSeparator());
  let uniqueName = [pluginName, bridgeRecord.name, dialectName].join(chores.getSeparator());
  if (!chores.isUpgradeSupported("bridge-full-ref")) {
    crateScope = bridgeRecord.name;
    crateName = dialectName;
    sectorRef = [crateScope, crateName].join(chores.getSeparator());
    uniqueName = [bridgeRecord.name, dialectName].join(chores.getSeparator());
  }

  const bridgeConstructor = bridgeRecord.construktor;
  if (!lodash.isFunction(bridgeConstructor)) {
    L && L.has("dunce") && L.log("dunce", T && T.toMessage({
      text: " - bridgeConstructor is invalid (not a function)"
    }));
    return result;
  }

  let configPath;
  if (!chores.isUpgradeSupported("bridge-full-ref")) {
    switch (optType) {
      case 0:
        configPath = ["sandboxConfig", "bridges", dialectName, bridgeCode];
        break;
      case 1:
        configPath = ["sandboxConfig", "bridges", bridgeCode, dialectName];
        break;
      default:
        configPath = ["sandboxConfig", "bridges", bridgeCode];
    }
  } else {
    let pluginAlias = pluginName;
    if (chores.isUpgradeSupported("standardizing-config")) {
      pluginAlias = nameResolver.getDefaultAliasOf(pluginName, FRAMEWORK_PLUGIN_LABEL);
    }
    configPath = ["sandboxConfig", "bridges", bridgeCode, pluginAlias, dialectName];
  }

  L && L.has("silly") && L.log("silly", T && T.add({ configPath }).toMessage({
    tags: [ sectorRef, "config-path" ],
    text: " - configPath: ${configPath}"
  }));

  function dialectConstructor (kwargs = {}) {
    const newFeatures = lodash.get(kwargs, ["profileConfig", "newFeatures", dialectName], null) ||
        lodash.get(kwargs, ["profileConfig", "newFeatures", bridgeCode], {});

    if (newFeatures.logoliteEnabled !== false) {
      const loggingFactory = kwargs.loggingFactory.branch(sectorRef);
      this.logger = loggingFactory.getLogger();
      this.tracer = loggingFactory.getTracer();
    } else {
      this.logger = kwargs.loggingFactory.getLogger({ sector: sectorRef });
    }

    L && L.has("silly") && L.log("silly", T && T.add({ dialectName, newFeatures }).toMessage({
      tags: [ sectorRef, "apply-features" ],
      text: " - newFeatures[${dialectName}]: ${newFeatures}"
    }));

    const opStatus = { stage: "instantiating", type: "DIALECT", name: dialectName, code: bridgeCode };
    try {
      if (newFeatures.logoliteEnabled !== false) {
        L && L.has("silly") && L.log("silly", T && T.toMessage({
          tags: [ sectorRef, "constructor-begin" ],
          text: " + constructor start ..."
        }));
      }

      bridgeConstructor.call(this, lodash.get(kwargs, configPath, {}));

      if (newFeatures.logoliteEnabled !== false) {
        L && L.has("silly") && L.log("silly", T && T.toMessage({
          tags: [ sectorRef, "constructor-end" ],
          text: " - constructor has finished"
        }));
      }
    } catch (err) {
      L && L.has("silly") && L.log("silly", T && T.add({ bridgeCode }).toMessage({
        tags: [ sectorRef, "constructor-failed" ],
        text: " - bridgeConstructor (${bridgeCode}) call has failed"
      }));
      opStatus.hasError = true;
      opStatus.stack = err.stack;
    }
    issueInspector.collect(opStatus);
  }

  util.inherits(dialectConstructor, bridgeConstructor);

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

  const construktor = objectDecorator.wrapBridgeDialect(dialectConstructor, {
    pluginName: pluginName,
    bridgeCode: bridgeCode,
    dialectName: dialectName
  });

  result[uniqueName] = {
    crateScope: crateScope,
    name: crateName,
    construktor: construktor
  };

  L && L.has("dunce") && L.log("dunce", T && T.add({ dialectName }).toMessage({
    text: " - building bridgeDialect (${dialectName}) has done."
  }));

  return result;
};

function buildBridgeDialects (ctx, bridgeList, dialectOptions, optType) {
  const {L, T, nameResolver} = ctx || this || {};

  optType = (lodash.isNumber(optType)) ? optType : 0;

  L && L.has("silly") && L.log("silly", T && T.add({ bridgeList }).toMessage({
    text: " - bridgeDialects will be built: ${bridgeList}"
  }));

  const bridgeConstructors = loadBridgeConstructors(ctx, bridgeList);

  if (lodash.isEmpty(dialectOptions)) {
    L && L.has("silly") && L.log("silly", T && T.toMessage({
      text: " - dialectOptions is not provided, nothing is created"
    }));
  } else {
    L && L.has("silly") && L.log("silly", T && T.add({ dialectOptions }).toMessage({
      text: " - dialectInstances will be built with options: ${dialectOptions}"
    }));
  }

  const bridgeDialects = {};
  if (!chores.isUpgradeSupported("bridge-full-ref")) {
    switch (optType) {
      case 0:
        lodash.forOwn(dialectOptions, function(dialectConfig, dialectName) {
          const bridgeCode = lodash.findKey(dialectConfig, function(o, k) {
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
            dialectName: bridgeCode + "Wrapper",
            optType
          }));
        });
    }
  } else {
    lodash.forOwn(dialectOptions, function(bridgeMap, bridgeCode) {
      if (!bridgeCode || !bridgeConstructors[bridgeCode]) return;
      lodash.forOwn(bridgeMap, function(pluginMap, pluginName) {
        pluginName = nameResolver.getOriginalNameOf(pluginName, FRAMEWORK_PLUGIN_LABEL);
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

  L && L.has("silly") && L.log("silly", T && T.add({
    bridgeDialectNames: lodash.keys(bridgeDialects)
  }).toMessage({
    text: " - bridgeDialects have been built: ${bridgeDialectNames}"
  }));

  return bridgeDialects;
};

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ private members
