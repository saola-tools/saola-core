'use strict';

const lodash = require('lodash');
const LogTracer = require('logolite').LogTracer;
const loader = require('../utils/loader');
const chores = require('../utils/chores');
const errorHandler = require('./error-handler').instance;

function BridgeLoader(params) {
  params = params || {};

  let blockRef = chores.getBlockRef(__filename);
  let loggingFactory = params.loggingFactory.branch(blockRef);
  let LX = loggingFactory.getLogger();
  let LT = loggingFactory.getTracer();
  let CTX = {blockRef, LX, LT};

  let store = {};

  LX.has('silly') && LX.log('silly', LT.toMessage({
    tags: [ blockRef, 'constructor-begin' ],
    text: ' + constructor start ...'
  }));

  LX.has('conlog') && LX.log('conlog', LT.add({
    bridgeRefs: params.bridgeRefs
  }).toMessage({
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

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ private members

  const BRIDGE_NAME_PATTERNS = [
    /^devebot-co-([a-z][a-z0-9\-]*)$/g,
    /^([a-z][a-z0-9\-]*)$/g
  ];

  let extractBridgeCode = function(ctx, bridgeRef) {
    let info = chores.extractCodeByPattern(ctx, BRIDGE_NAME_PATTERNS, bridgeRef.name);
    if (info.i < 0) {
      errorHandler.collect(lodash.assign({
        stage: 'naming',
        type: 'bridge',
        hasError: true,
        stack: BRIDGE_NAME_PATTERNS.toString()
      }, bridgeRef));
    }
    return info.code;
  }

  let loadBridgeContructor = function(ctx, bridgeRef) {
    let {blockRef, LX, LT} = ctx;

    bridgeRef = bridgeRef || {};

    let bridgeName = bridgeRef.name;
    let bridgePath = bridgeRef.path;

    LX.has('conlog') && LX.log('conlog', LT.add({
      bridgeName: bridgeName
    }).toMessage({
      text: ' - bridge constructor (${bridgeName}) loading is started'
    }));

    let result = {};

    let bridgeCode = extractBridgeCode(ctx, bridgeRef);
    if (typeof(bridgeCode) !== 'string') return result;

    let opStatus = lodash.assign({ type: 'DIALECT', code: bridgeCode }, bridgeRef);

    try {
      let bridgeConstructor = loader(bridgePath, { stopWhenError: true });
      LX.has('conlog') && LX.log('conlog', LT.add({
        bridgeName: bridgeName
      }).toMessage({
        text: ' - bridge constructor (${bridgeName}) loading has done.'
      }));
      if (lodash.isFunction(bridgeConstructor)) {
        result[bridgeCode] = {
          name: bridgeName,
          construktor: bridgeConstructor
        };
        opStatus.hasError = false;
      } else {
        LX.has('conlog') && LX.log('conlog', LT.add({
          bridgeName: bridgeName
        }).toMessage({
          text: ' - bridge "${bridgeName}" is not a constructor'
        }));
        opStatus.hasError = true;
      }
    } catch(err) {
      LX.has('conlog') && LX.log('conlog', LT.add({
        bridgeName: bridgeName
      }).toMessage({
        text: ' - bridge constructor (${bridgeName}) loading has failed'
      }));
      opStatus.hasError = true;
      opStatus.stack = err.stack;
    }

    errorHandler.collect(opStatus);

    return result;
  };

  let loadBridgeConstructors = function(ctx, bridgeRefs) {
    let {blockRef, LX, LT} = ctx;

    bridgeRefs = lodash.isArray(bridgeRefs) ? bridgeRefs : [];

    bridgeRefs = lodash.filter(bridgeRefs, function(bridgeRef) {
      return lodash.isString(bridgeRef.name) && lodash.isString(bridgeRef.path);
    });

    LX.has('conlog') && LX.log('conlog', LT.add({
      bridgeRefs: bridgeRefs
    }).toMessage({
      text: ' - load a list of bridge constructors: ${bridgeRefs}'
    }));

    let bridgeConstructors = {};
    bridgeRefs.forEach(function(bridgeRef) {
      lodash.assign(bridgeConstructors, loadBridgeContructor(ctx, bridgeRef));
    });

    LX.has('conlog') && LX.log('conlog', LT.add({
      bridgeConstructorNames: lodash.keys(bridgeConstructors)
    }).toMessage({
      text: ' - bridge constructors have been loaded: ${bridgeConstructorNames}'
    }));

    return bridgeConstructors;
  };

  let buildBridgeDialect = function(ctx, dialectOpts) {
    let {blockRef, LX, LT} = ctx;
    let {pluginName, bridgeCode, bridgeRecord, dialectName, optType} = dialectOpts;
    let result = {};

    if (!lodash.isString(bridgeCode)) {
      LX.has('conlog') && LX.log('conlog', LT.toMessage({
        text: ' - bridgeCode is invalid (not a string)'
      }));
      return result;
    } else {
      LX.has('conlog') && LX.log('conlog', LT.add({
        dialectOptions: dialectOpts
      }).toMessage({
        text: ' - buildBridgeDialect() with parameters: ${dialectOptions}'
      }));
    }

    dialectName = dialectName || bridgeCode + 'Wrapper';
    LX.has('conlog') && LX.log('conlog', LT.add({
      dialectName: dialectName
    }).toMessage({
      text: ' - building bridgeDialect (${dialectName}) is started'
    }));

    let crateScope = pluginName;
    let crateName = [bridgeCode, dialectName].join('#');
    let sectorRef = [crateScope, crateName].join(chores.getSeparator());
    let uniqueName = [pluginName, bridgeRecord.name, dialectName].join(chores.getSeparator());
    if (!chores.isFeatureSupported('bridge-full-ref')) {
      crateScope = bridgeRecord.name;
      crateName = dialectName;
      sectorRef = [crateScope, crateName].join(chores.getSeparator());
      uniqueName = [bridgeRecord.name, dialectName].join(chores.getSeparator());
    }

    let bridgeConstructor = bridgeRecord.construktor;
    if (!lodash.isFunction(bridgeConstructor)) {
      LX.has('conlog') && LX.log('conlog', LT.toMessage({
        text: ' - bridgeConstructor is invalid (not a function)'
      }));
      return result;
    }

    let configPath;
    if (!chores.isFeatureSupported('bridge-full-ref')) {
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
      configPath = ['sandboxConfig', 'bridges', bridgeCode, pluginName, dialectName];
    }

    function dialectConstructor(kwargs) {
      kwargs = kwargs || {};

      let isWrapped = false;
      let getWrappedParams = function() {
        if (isWrapped) return kwargs;
        isWrapped = true;
        return kwargs = lodash.clone(kwargs);
      }

      let newFeatures = lodash.get(kwargs, ['profileConfig', 'newFeatures', dialectName], null);
      if (newFeatures === null) {
        newFeatures = lodash.get(kwargs, ['profileConfig', 'newFeatures', bridgeCode], {});
      }

      if (newFeatures.logoliteEnabled) {
        let loggingFactory = kwargs.loggingFactory.branch(sectorRef);
        this.logger = loggingFactory.getLogger();
        this.tracer = loggingFactory.getTracer();
      } else {
        this.logger = kwargs.loggingFactory.getLogger({ sector: sectorRef });
      }

      LX.has('silly') && LX.log('silly', LT.add({
        dialectName: dialectName,
        newFeatures: newFeatures
      }).toMessage({
        tags: [ sectorRef, 'apply-features' ],
        text: ' - newFeatures[${dialectName}]: ${newFeatures}'
      }));

      let opStatus = { stage: 'instantiating', type: 'DIALECT', name: dialectName, code: bridgeCode };
      try {
        if (newFeatures.logoliteEnabled) {
          LX.has('silly') && LX.log('silly', LT.toMessage({
            tags: [ sectorRef, 'constructor-begin' ],
            text: ' + constructor start ...'
          }));
        }

        bridgeConstructor.call(this, lodash.assign({
          tracking_code: kwargs.sandboxName
        }, lodash.get(kwargs, configPath, {})));

        if (newFeatures.logoliteEnabled) {
          LX.has('silly') && LX.log('silly', LT.toMessage({
            tags: [ sectorRef, 'constructor-end' ],
            text: ' - constructor has finished'
          }));
        }
      } catch(err) {
        LX.has('silly') && LX.log('silly', LT.add({
          bridgeCode: bridgeCode
        }).toMessage({
          tags: [ sectorRef, 'constructor-failed' ],
          text: ' - bridgeConstructor (${bridgeCode}) call has failed'
        }));
        opStatus.hasError = true;
        opStatus.stack = err.stack;
      }
      errorHandler.collect(opStatus);
    }

    dialectConstructor.prototype = Object.create(bridgeConstructor.prototype);

    dialectConstructor.argumentSchema = {
      "$id": dialectName,
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

    result[uniqueName] = {
      crateScope: crateScope,
      name: crateName,
      construktor: dialectConstructor
    };

    LX.has('conlog') && LX.log('conlog', LT.add({
      dialectName: dialectName
    }).toMessage({
      text: ' - building bridgeDialect (${dialectName}) has done.'
    }));

    return result;
  };

  let buildBridgeDialects = function(ctx, bridgeRefs, dialectOptions, optType) {
    let {blockRef, LX, LT} = ctx;

    optType = (lodash.isNumber(optType)) ? optType : 0;

    LX.has('silly') && LX.log('silly', LT.add({
      bridgeRefs: bridgeRefs
    }).toMessage({
      text: ' - bridgeDialects will be built: ${bridgeRefs}'
    }));

    let bridgeConstructors = loadBridgeConstructors(ctx, bridgeRefs);

    if (lodash.isEmpty(dialectOptions)) {
      LX.has('silly') && LX.log('silly', LT.add({
        options: dialectOptions
      }).toMessage({
        text: ' - dialectOptions is not provided, nothing is created'
      }));
    } else {
      LX.has('silly') && LX.log('silly', LT.add({
        options: dialectOptions
      }).toMessage({
        text: ' - dialectInstances will be built with options: ${options}'
      }));
    }

    let bridgeDialects = {};
    if (!chores.isFeatureSupported('bridge-full-ref')) {
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

    LX.has('silly') && LX.log('silly', LT.add({
      bridgeDialectNames: lodash.keys(bridgeDialects)
    }).toMessage({
      text: ' - bridgeDialects have been built: ${bridgeDialectNames}'
    }));

    return bridgeDialects;
  };

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ private members

  LX.has('silly') && LX.log('silly', LT.toMessage({
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
        }
      }
    },
    "loggingFactory": {
      "type": "object"
    }
  }
};

module.exports = BridgeLoader;
