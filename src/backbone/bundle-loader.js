"use strict";

const lodash = require("lodash");
const path = require("path");
const util = require("util");
const chores = require("../utils/chores");
const constx = require("../utils/constx");
const loader = require("../utils/loader");
const blockRef = chores.getBlockRef(__filename);

const FILE_JS_FILTER_PATTERN = constx.FILE.JS_FILTER_PATTERN;

function BundleLoader (params = {}) {
  const loggingFactory = params.loggingFactory.branch(blockRef);
  const L = loggingFactory.getLogger();
  const T = loggingFactory.getTracer();
  const CTX = lodash.assign({L, T}, lodash.pick(params, [
    "issueInspector", "nameResolver", "schemaValidator", "objectDecorator"
  ]));

  L && L.has("silly") && L.log("silly", T && T.toMessage({
    tags: [blockRef, "constructor-begin"],
    text: " + constructor start ..."
  }));

  L && L.has("dunce") && L.log("dunce", T && T.add(params).toMessage({
    text: " - bundleLoader start with bundleList: ${bundleList}"
  }));

  this.loadMetadata = function(metadataMap) {
    return loadAllMetainfs(CTX, metadataMap, params.bundleList);
  };

  this.loadRoutines = function(routineMap, routineContext) {
    return loadAllScripts(CTX, routineMap, "ROUTINE", routineContext, params.bundleList);
  };

  this.loadServices = function(serviceMap) {
    return loadAllGadgets(CTX, serviceMap, "SERVICE", params.bundleList);
  };

  this.loadTriggers = function(triggerMap) {
    return loadAllGadgets(CTX, triggerMap, "TRIGGER", params.bundleList);
  };

  L && L.has("silly") && L.log("silly", T && T.toMessage({
    tags: [ blockRef, "constructor-end" ],
    text: " - constructor has finished"
  }));
}

BundleLoader.argumentSchema = {
  "$id": "bundleLoader",
  "type": "object",
  "properties": {
    "bundleList": {
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
    },
    "schemaValidator": {
      "type": "object"
    }
  }
};

module.exports = BundleLoader;

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ private members

function hasSeparatedDir (scriptType) {
  return lodash.filter(constx, function(obj, key) {
    // return ['METAINF', 'ROUTINE', 'SERVICE', 'TRIGGER'].indexOf(key) >= 0;
    return obj.ROOT_KEY && obj.SCRIPT_DIR;
  }).filter(function(info) {
    return info.ROOT_KEY !== constx[scriptType].ROOT_KEY &&
        info.SCRIPT_DIR === constx[scriptType].SCRIPT_DIR;
  }).length === 0;
}

function getFilterPattern (scriptType) {
  return hasSeparatedDir(scriptType) ? FILE_JS_FILTER_PATTERN : constx[scriptType].ROOT_KEY + "_" + FILE_JS_FILTER_PATTERN;
}

function loadAllScripts (ctx, scriptMap, scriptType, scriptContext, pluginRootDirs) {
  scriptMap = scriptMap || {};

  if (scriptType !== "ROUTINE") return scriptMap;

  pluginRootDirs.forEach(function(pluginRootDir) {
    loadScriptEntries(ctx, scriptMap, scriptType, scriptContext, pluginRootDir);
  });

  return scriptMap;
};

function loadScriptEntries (ctx, scriptMap, scriptType, scriptContext, pluginRootDir) {
  const { L, T } = ctx || this || {};

  const scriptSubDir = chores.getComponentDir(pluginRootDir, scriptType);
  const scriptFolder = path.join(pluginRootDir.path, scriptSubDir);
  L && L.has("dunce") && L.log("dunce", T && T.add({
    scriptKey: constx[scriptType].ROOT_KEY,
    scriptFolder: scriptFolder
  }).toMessage({
    text: " - load ${scriptKey}s from folder: ${scriptFolder}"
  }));

  const scriptFiles = chores.filterFiles(scriptFolder, getFilterPattern(scriptType));
  scriptFiles.forEach(function(scriptFile) {
    loadScriptEntry(ctx, scriptMap, scriptType, scriptSubDir, scriptFile, scriptContext, pluginRootDir);
  });
};

function loadScriptEntry (ctx, scriptMap, scriptType, scriptSubDir, scriptFile, scriptContext, pluginRootDir) {
  const { L, T, issueInspector, nameResolver } = ctx || this || {};
  const opStatus = lodash.assign({ type: scriptType, file: scriptFile, subDir: scriptSubDir }, pluginRootDir);
  const filepath = path.join(pluginRootDir.path, scriptSubDir, scriptFile);
  try {
    const scriptInit = loader(filepath, { stopWhenError: true });
    if (lodash.isFunction(scriptInit)) {
      L && L.has("dunce") && L.log("dunce", T && T.add({ filepath }).toMessage({
        text: " - script file ${filepath} is ok"
      }));
      const scriptObject = scriptInit(scriptContext);
      const output = validateScript(ctx, scriptObject, scriptType);
      if (!output.valid) {
        L && L.has("dunce") && L.log("dunce", T && T.add({
          validationResult: output
        }).toMessage({
          text: " - validating script fail: ${validationResult}"
        }));
        opStatus.hasError = true;
      } else if (scriptObject.enabled === false) {
        L && L.has("dunce") && L.log("dunce", T && T.toMessage({
          text: " - script is disabled"
        }));
        opStatus.hasError = false;
        opStatus.isSkipped = true;
      } else {
        L && L.has("dunce") && L.log("dunce", T && T.toMessage({
          text: " - script validation pass"
        }));
        opStatus.hasError = false;
        const scriptName = scriptFile.replace(".js", "").toLowerCase();
        let pluginName = nameResolver.getOriginalNameOf(pluginRootDir.name, pluginRootDir.type);
        if (!chores.isUpgradeSupported("refining-name-resolver")) {
          pluginName = nameResolver.getOriginalName(pluginRootDir);
        }
        const uniqueName = [pluginName, scriptName].join(chores.getSeparator());
        const entry = {};
        entry[uniqueName] = {
          crateScope: pluginName,
          name: scriptName,
          object: scriptObject
        };
        lodash.defaultsDeep(scriptMap, entry);
      }
    } else {
      L && L.has("dunce") && L.log("dunce", T && T.add({ filepath }).toMessage({
        text: " - script file ${filepath} doesnot contain a function."
      }));
      opStatus.stack = chores.formatTemplate("Service file ${filepath} does not contain a function", {
        filepath
      });
      opStatus.hasError = true;
    }
  } catch (err) {
    L && L.has("dunce") && L.log("dunce", T && T.add({ filepath }).toMessage({
      text: " - script file ${filepath} loading has failed."
    }));
    opStatus.hasError = true;
    opStatus.stack = err.stack;
  }
  issueInspector.collect(opStatus);
};

function validateScript (ctx, scriptObject, scriptType) {
  const { schemaValidator } = ctx || this || {};
  const results = [];

  scriptObject = scriptObject || {};

  results.push(schemaValidator.validate(scriptObject, constx[scriptType].SCHEMA_OBJECT));

  if (!lodash.isFunction(scriptObject.handler)) {
    results.push({
      valid: false,
      errors: [{
        message: "handler has wrong type: " + typeof(scriptObject.handler)
      }]
    });
  }

  return results.reduce(function(output, result) {
    output.valid = output.valid && (result.valid !== false);
    output.errors = output.errors.concat(result.errors);
    return output;
  }, { valid: true, errors: [] });
};

function loadAllMetainfs (ctx, metainfMap, pluginRootDirs) {
  ctx = ctx || this || {};
  metainfMap = metainfMap || {};
  pluginRootDirs.forEach(function(pluginRootDir) {
    loadMetainfEntries(ctx, metainfMap, pluginRootDir);
  });
  return metainfMap;
}

function loadMetainfEntries (ctx, metainfMap, pluginRootDir) {
  const { L, T } = ctx = ctx || this || {};
  const metainfType = "METAINF";
  const metainfSubDir = chores.getComponentDir(pluginRootDir, metainfType);
  const metainfFolder = path.join(pluginRootDir.path, metainfSubDir);
  L && L.has("dunce") && L.log("dunce", T && T.add({
    metainfKey: constx[metainfType].ROOT_KEY, metainfFolder
  }).toMessage({
    text: " - load ${metainfKey}s from folder: ${metainfFolder}"
  }));
  const schemaFiles = chores.filterFiles(metainfFolder, getFilterPattern(metainfType));
  schemaFiles.forEach(function(schemaFile) {
    loadMetainfEntry(ctx, metainfMap, metainfSubDir, schemaFile, pluginRootDir);
  });
}

function loadMetainfEntry (ctx, metainfMap, metainfSubDir, schemaFile, pluginRootDir) {
  const { L, T, issueInspector, nameResolver } = ctx || this || {};
  const metainfType = "METAINF";
  const opStatus = lodash.assign({ type: "METAINF", file: schemaFile, subDir: metainfSubDir }, pluginRootDir);
  const filepath = path.join(pluginRootDir.path, metainfSubDir, schemaFile);
  try {
    const metainfObject = loader(filepath, { stopWhenError: true });
    const output = validateMetainf(ctx, metainfObject, metainfType);
    if (!output.valid) {
      L && L.has("dunce") && L.log("dunce", T && T.add({
        validationResult: output
      }).toMessage({
        text: " - validating schema fail: ${validationResult}"
      }));
      opStatus.hasError = true;
    } else if (metainfObject.enabled === false) {
      L && L.has("dunce") && L.log("dunce", T && T.toMessage({
        text: " - schema is disabled"
      }));
      opStatus.hasError = false;
      opStatus.isSkipped = true;
    } else {
      L && L.has("dunce") && L.log("dunce", T && T.toMessage({
        text: " - schema validation pass"
      }));
      opStatus.hasError = false;
      const typeName = metainfObject.type || schemaFile.replace(".js", "").toLowerCase();
      const subtypeName = metainfObject.subtype || "default";
      let crateScope = nameResolver.getOriginalNameOf(pluginRootDir.name, pluginRootDir.type);
      let pluginCode = nameResolver.getDefaultAliasOf(pluginRootDir.name, pluginRootDir.type);
      if (!chores.isUpgradeSupported("refining-name-resolver")) {
        crateScope = nameResolver.getOriginalName(pluginRootDir);
        pluginCode = nameResolver.getDefaultAlias(pluginRootDir);
      }
      const uniqueName = [crateScope, typeName].join(chores.getSeparator());
      const entry = {};
      entry[uniqueName] = entry[uniqueName] || {};
      entry[uniqueName][subtypeName] = {
        crateScope: crateScope,
        pluginCode: pluginCode,
        type: typeName,
        subtype: subtypeName,
        schema: metainfObject.schema
      };
      lodash.defaultsDeep(metainfMap, entry);
    }
  } catch (err) {
    L && L.has("dunce") && L.log("dunce", T && T.add({ filepath }).toMessage({
      text: " - schema file ${filepath} loading has failed"
    }));
    L && L.has("dunce") && chores.printError(err);
    opStatus.hasError = true;
    opStatus.stack = err.stack;
  }
  issueInspector.collect(opStatus);
}

function validateMetainf (ctx, metainfObject) {
  const { schemaValidator } = ctx = ctx || this || {};
  const metainfType = "METAINF";
  const results = [];
  metainfObject = metainfObject || {};
  results.push(schemaValidator.validate(metainfObject, constx[metainfType].SCHEMA_OBJECT));
  return results.reduce(function(output, result) {
    output.valid = output.valid && (result.valid !== false);
    output.errors = output.errors.concat(result.errors);
    return output;
  }, { valid: true, errors: [] });
};

function loadAllGadgets (ctx, gadgetMap, gadgetType, pluginRootDirs) {
  gadgetMap = gadgetMap || {};
  if (["SERVICE", "TRIGGER"].indexOf(gadgetType) < 0) return gadgetMap;
  pluginRootDirs.forEach(function(pluginRootDir) {
    loadGadgetEntries(ctx, gadgetMap, gadgetType, pluginRootDir);
  });
  return gadgetMap;
};

function loadGadgetEntries (ctx, gadgetMap, gadgetType, pluginRootDir) {
  const { L, T } = ctx || this || {};

  const gadgetSubDir = chores.getComponentDir(pluginRootDir, gadgetType);
  const gadgetFolder = path.join(pluginRootDir.path, gadgetSubDir);
  L && L.has("dunce") && L.log("dunce", T && T.add({
    gadgetKey: constx[gadgetType].ROOT_KEY,
    gadgetFolder: gadgetFolder
  }).toMessage({
    text: " - load ${gadgetKey}s from folder: ${gadgetFolder}"
  }));

  const gadgetFiles = chores.filterFiles(gadgetFolder, getFilterPattern(gadgetType));
  gadgetFiles.forEach(function(gadgetFile) {
    loadGadgetEntry(ctx, gadgetMap, gadgetType, gadgetSubDir, gadgetFile, pluginRootDir);
  });
};

function loadGadgetEntry (ctx, gadgetMap, gadgetType, gadgetSubDir, gadgetFile, pluginRootDir) {
  const { L, T, issueInspector } = ctx || this || {};
  const opStatus = lodash.assign({ type: gadgetType, file: gadgetFile, subDir: gadgetSubDir }, pluginRootDir);
  const filepath = path.join(pluginRootDir.path, gadgetSubDir, gadgetFile);
  try {
    const gadgetConstructor = loader(filepath, { stopWhenError: true });
    L && L.has("dunce") && L.log("dunce", T && T.add({ filepath }).toMessage({
      text: " - gadget file ${filepath} loading has done"
    }));
    if (lodash.isFunction(gadgetConstructor)) {
      const gadgetName = chores.stringCamelCase(gadgetFile.replace(".js", ""));
      lodash.defaults(gadgetMap, buildGadgetWrapper(ctx, gadgetConstructor, gadgetType, gadgetName, pluginRootDir));
      opStatus.hasError = false;
    } else {
      L && L.has("dunce") && L.log("dunce", T && T.add({ filepath }).toMessage({
        text: " - gadget file ${filepath} doesnot contain a function"
      }));
      opStatus.hasError = true;
    }
  } catch (err) {
    L && L.has("dunce") && L.log("dunce", T && T.add({ filepath }).toMessage({
      text: " - gadget file ${filepath} loading has failed"
    }));
    L && L.has("dunce") && chores.printError(err);
    opStatus.hasError = true;
    opStatus.stack = err.stack;
  }
  issueInspector.collect(opStatus);
};

function buildGadgetWrapper (ctx, gadgetConstructor, gadgetType, wrapperName, pluginRootDir) {
  const { L, T, nameResolver, objectDecorator } = ctx || this || {};
  const result = {};

  if (!lodash.isFunction(gadgetConstructor)) {
    L && L.has("dunce") && L.log("dunce", T && T.toMessage({
      text: " - gadgetConstructor is invalid"
    }));
    return result;
  }

  let pluginName = nameResolver.getOriginalNameOf(pluginRootDir.name, pluginRootDir.type);
  let pluginCode = nameResolver.getDefaultAliasOf(pluginRootDir.name, pluginRootDir.type);
  if (!chores.isUpgradeSupported("refining-name-resolver")) {
    pluginName = nameResolver.getOriginalName(pluginRootDir);
    pluginCode = nameResolver.getDefaultAlias(pluginRootDir);
  }
  const uniqueName = [pluginName, wrapperName].join(chores.getSeparator());
  const referenceAlias = lodash.get(pluginRootDir, ["presets", "referenceAlias"], {});

  function wrapperConstructor (kwargs = {}) {
    const _ref_ = { kwargs: null };
    function getWrappedParams (kwargs) {
      return _ref_.kwargs = _ref_.kwargs || lodash.clone(kwargs) || {};
    }
    // crateScope & componentName
    kwargs.packageName = pluginRootDir.name;
    kwargs.componentName = wrapperName;
    kwargs.componentId = uniqueName;
    // resolve newFeatures
    const newFeatures = lodash.get(kwargs, ["profileConfig", "newFeatures", pluginCode], {});
    L && L.has("dunce") && L.log("dunce", T && T.add({ pluginCode, newFeatures }).toMessage({
      text: " - newFeatures[${pluginCode}]: ${newFeatures}"
    }));
    // resolve plugin configuration path
    if (newFeatures.sandboxConfig !== false) {
      kwargs = getWrappedParams(kwargs);
      if (chores.isSpecialBundle(pluginRootDir.type)) {
        kwargs.sandboxOrigin = lodash.get(kwargs, ["sandboxOrigin", pluginCode], {});
        kwargs.sandboxConfig = lodash.get(kwargs, ["sandboxConfig", pluginCode], {});
      } else {
        kwargs.sandboxOrigin = lodash.get(kwargs, ["sandboxOrigin", "plugins", pluginCode], {});
        kwargs.sandboxConfig = lodash.get(kwargs, ["sandboxConfig", "plugins", pluginCode], {});
      }
    }
    // wrap getLogger() and add getTracer()
    if (newFeatures.logoliteEnabled !== false) {
      kwargs = getWrappedParams(kwargs);
      kwargs.loggingFactory = kwargs.loggingFactory.branch(uniqueName);
    }
    // transform parameters by referenceAlias
    if (!lodash.isEmpty(referenceAlias)) {
      kwargs = getWrappedParams(kwargs);
      lodash.forOwn(referenceAlias, function(oldKey, newKey) {
        if (kwargs[oldKey]) {
          kwargs[newKey] = kwargs[oldKey];
        }
      });
      if (constx.LOADING.DELETE_OLD_REFERENCE_ALIAS) {
        // remove the old references
        const newKeys = lodash.keys(referenceAlias);
        const oldKeys = lodash.values(referenceAlias);
        lodash.forEach(oldKeys, function(oldKey) {
          if (newKeys.indexOf(oldKey) < 0) {
            delete kwargs[oldKey];
          }
        });
      }
    }
    // transform parameters by referenceHash (after referenceAlias)
    const referenceHash = gadgetConstructor.referenceHash;
    if (lodash.isObject(referenceHash)) {
      kwargs = getWrappedParams(kwargs);
      lodash.forOwn(referenceHash, function(fullname, shortname) {
        if (kwargs[fullname]) {
          kwargs[shortname] = kwargs[fullname];
        }
      });
    }
    // write around-log begin
    if (newFeatures.logoliteEnabled !== false && chores.isUpgradeSupported("gadget-around-log")) {
      this.logger = kwargs.loggingFactory.getLogger();
      this.tracer = kwargs.loggingFactory.getTracer();
      this.logger.has("silly") && this.logger.log("silly", this.tracer.toMessage({
        tags: [ uniqueName, "constructor-begin" ],
        text: " + constructor begin ..."
      }));
    }
    // invoke original constructor
    gadgetConstructor.call(this, kwargs);
    // write around-log end
    if (newFeatures.logoliteEnabled !== false && chores.isUpgradeSupported("gadget-around-log")) {
      this.logger.has("silly") && this.logger.log("silly", this.tracer.toMessage({
        tags: [ uniqueName, "constructor-end" ],
        text: " - constructor has finished"
      }));
    }
  }

  util.inherits(wrapperConstructor, gadgetConstructor);

  const wrappedArgumentFields = [
    "sandboxName", "sandboxOrigin", "sandboxConfig", "profileName", "profileConfig", "loggingFactory"
  ];

  if (gadgetConstructor.argumentSchema) {
    const wrappedArgumentSchema = {
      "$id": uniqueName,
      "type": "object",
      "properties": {}
    };
    lodash.forEach(wrappedArgumentFields, function(fieldName) {
      if (["sandboxName", "profileName"].indexOf(fieldName) >= 0) {
        wrappedArgumentSchema.properties[fieldName] = { "type": "string" };
      } else {
        wrappedArgumentSchema.properties[fieldName] = { "type": "object" };
      }
    });
    const originalArgumentSchema = lodash.omit(gadgetConstructor.argumentSchema, ["$id"]);
    wrapperConstructor.argumentSchema = lodash.merge(wrappedArgumentSchema, originalArgumentSchema);
    if (!lodash.isEmpty(referenceAlias)) {
      const properties = lodash.mapKeys(gadgetConstructor.argumentSchema.properties, function(val, key) {
        return referenceAlias[key] || key;
      });
      wrapperConstructor.argumentSchema = lodash.merge(wrappedArgumentSchema, { properties });
    }
    L && L.has("dunce") && L.log("dunce", T && T.add({
      argumentSchema: wrapperConstructor.argumentSchema
    }).toMessage({
      text: " - wrapperConstructor.argumentSchema: ${argumentSchema}"
    }));
  } else {
    let wrappedArgumentProps = gadgetConstructor.referenceList || [];
    if (gadgetConstructor.referenceHash) {
      wrappedArgumentProps = lodash.values(gadgetConstructor.referenceHash);
    }
    if (!lodash.isEmpty(referenceAlias)) {
      wrappedArgumentProps = lodash.map(wrappedArgumentProps, function(key) {
        return referenceAlias[key] || key;
      });
    }
    wrappedArgumentProps = wrappedArgumentFields.concat(wrappedArgumentProps);
    wrapperConstructor.argumentProperties = lodash.uniq(wrappedArgumentProps);
    L && L.has("dunce") && L.log("dunce", T && T.add({
      argumentProperties: wrapperConstructor.argumentProperties
    }).toMessage({
      text: " - wrapperConstructor.argumentProperties: ${argumentProperties}"
    }));
  }

  let construktor = wrapperConstructor;
  const gadgetGroup = lodash.get(constx, [gadgetType, "GROUP"]);
  if (["reducers", "services", "triggers"].indexOf(gadgetGroup) >= 0) {
    construktor = objectDecorator.wrapPluginGadget(construktor, {
      pluginName: pluginName,
      gadgetType: gadgetGroup,
      gadgetName: wrapperName
    });
  }

  result[uniqueName] = {
    crateScope: pluginName,
    name: wrapperName,
    construktor: construktor
  };

  L && L.has("dunce") && L.log("dunce", T && T.add({
    uniqueName: uniqueName,
    crateScope: pluginName,
    name: wrapperName
  }).toMessage({
    text: " - build gadget wrapper (${name}) has done."
  }));

  return result;
};
