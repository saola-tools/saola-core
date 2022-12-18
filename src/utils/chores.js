"use strict";

const assert = require("assert");
const lodash = require("lodash");
const semver = require("semver");
const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const util = require("util");
const uuidv4 = require("logolite/uuidv4");
const format = require("logolite/lib/format");
const Validator = require("schemato").Validator;
const constx = require("./constx");
const loader = require("./loader");
const envbox = require("./envbox");
const nodash = require("./nodash");
const getenv = require("./getenv");

const codetags = require("codetags")
  .getInstance(constx.FRAMEWORK.NAME, {
    namespace: constx.FRAMEWORK.NAME,
    INCLUDED_TAGS: "UPGRADE_ENABLED",
    EXCLUDED_TAGS: "UPGRADE_DISABLED",
    version: constx.FRAMEWORK.VERSION,
  })
  .register(constx.UPGRADE_TAGS);

const store = {
  defaultScope: getenv("DEVEBOT_DEFAULT_SCOPE", constx.FRAMEWORK.NAME),
  injektorOptions: {
    namePatternTemplate: "^[a-zA-Z]{1}[a-zA-Z0-9&#\\-_%s]*$",
    separator: "/"
  },
  injektorContext: { scope: constx.FRAMEWORK.NAME },
  validatorOptions: { schemaVersion: 4 }
};
const chores = {};

chores.assertOk = function () {
  for (const k in arguments) {
    assert.ok(arguments[k], util.format("The argument #%s evaluated to a falsy value", k));
  }
};

chores.getUUID = function() {
  return uuidv4();
};

chores.formatTemplate = function(tmpl, data) {
  return format(tmpl, data);
};

chores.loadPackageInfo = function(pkgRootPath, selectedFieldNames, defaultInfo) {
  try {
    const pkgJson = JSON.parse(fs.readFileSync(path.join(pkgRootPath, "/package.json"), "utf8"));
    if (lodash.isArray(selectedFieldNames)) {
      return lodash.pick(pkgJson, selectedFieldNames);
    }
    return pkgJson;
  } catch (err) {
    return defaultInfo || null;
  }
};

chores.getFirstDefinedValue = function() {
  for (const i in arguments) {
    const val = arguments[i];
    if (val !== undefined && val !== null) return val;
  }
  return undefined;
};

chores.kickOutOf = function(map, excludedNames) {
  if (lodash.isObject(map) && lodash.isArray(excludedNames)) {
    lodash.forEach(excludedNames, function(name) {
      if (name in map) delete map[name];
    });
  }
};

chores.isOwnOrInheritedProperty = function(object, property) {
  for (const propName in object) {
    if (propName === property) return true;
  }
  return object.hasOwnProperty(property);
};

chores.pickProperty = function(propName, containers, propDefault) {
  if (!lodash.isString(propName) || !lodash.isArray(containers)) return null;
  for (const i in containers) {
    if (lodash.isObject(containers[i]) && containers[i][propName]) {
      return containers[i][propName];
    }
  }
  return propDefault;
};

chores.deepFreeze = function (o) {
  const self = this;
  Object.freeze(o);
  Object.getOwnPropertyNames(o).forEach(function (prop) {
    if (o.hasOwnProperty(prop) &&
        (nodash.isObject(o[prop]) || nodash.isFunction(o[prop])) &&
        !Object.isFrozen(o[prop])) {
      self.deepFreeze(o[prop]);
    }
  });
  return o;
};

chores.fileExists = function(filepath) {
  return fs.existsSync(filepath);
};

chores.filterFiles = function(dir, filter, filenames) {
  filenames = filenames || [];
  const regex = (filter) ? new RegExp(filter) : null;
  try {
    const files = fs.readdirSync(dir);
    for (const i in files) {
      if ((regex) ? regex.test(files[i]) : true) {
        const name = dir + "/" + files[i];
        if (fs.statSync(name).isFile()) {
          filenames.push(files[i]);
        }
      }
    }
  } catch (err) {}
  return filenames;
};

chores.loadServiceByNames = function(serviceMap, serviceFolder, serviceNames) {
  serviceNames = nodash.arrayify(serviceNames);
  serviceNames.forEach(function(serviceName) {
    const filepath = path.join(serviceFolder, serviceName + ".js");
    const serviceConstructor = loader(filepath);
    if (lodash.isFunction(serviceConstructor)) {
      const serviceEntry = {};
      serviceEntry[chores.stringCamelCase(serviceName)] = serviceConstructor;
      lodash.defaults(serviceMap, serviceEntry);
    }
  });
  return serviceMap;
};

chores.stringKebabCase = function kebabCase (str) {
  if (!nodash.isString(str)) return str;
  return str.toLowerCase().replace(/\s{1,}/g, "-");
};

chores.stringLabelCase = function labelCase (str) {
  if (!nodash.isString(str)) return str;
  return str.toUpperCase().replace(/\W{1,}/g, "_");
};

chores.stringCamelCase = function camelCase (str) {
  if (!nodash.isString(str)) return str;
  return str
    .replace(/-([a-z])/g, function (m, w) { return w.toUpperCase(); })
    .replace(/-([0-9])/g, function (m, w) { return "_" + w; });
};

chores.assertDir = function(appName) {
  const configDir = path.join(this.homedir(), "." + appName);
  try {
    fs.readdirSync(configDir);
  } catch (err) {
    if (err.code === "ENOENT") {
      try {
        fs.mkdirSync(configDir);
      } catch (err) {
        return null;
      }
    } else {
      return null;
    }
  }
  return configDir;
};

chores.homedir = (typeof os.homedir === "function") ? os.homedir : function() {
  const env = process.env;
  const home = env.HOME;
  const user = env.LOGNAME || env.USER || env.LNAME || env.USERNAME;

  if (process.platform === "win32") {
    return env.USERPROFILE || env.HOMEDRIVE + env.HOMEPATH || home || null;
  }

  if (process.platform === "darwin") {
    return home || (user ? "/Users/" + user : null);
  }

  if (process.platform === "linux") {
    return home || (process.getuid() === 0 ? "/root" : (user ? "/home/" + user : null));
  }

  return home || null;
};

const SPECIAL_BUNDLES = ["application", "framework", constx.FRAMEWORK.NAME];

chores.isSpecialBundle = function(bundle) {
  return (SPECIAL_BUNDLES.indexOf(_getBundleType(bundle)) >= 0);
};

chores.isAppboxBundle = function(bundle) {
  return _getBundleType(bundle) === "application";
};

chores.isFrameworkBundle = function(bundle) {
  const type = _getBundleType(bundle);
  return type === "framework" || type === "devebot";
};

function _getBundleType (bundle) {
  return lodash.isString(bundle) && bundle || lodash.isObject(bundle) && bundle.type;
}

chores.extractCodeByPattern = function(patterns, name) {
  assert.ok(patterns instanceof Array);
  for (const k in patterns) {
    assert.ok(patterns[k] instanceof RegExp);
  }
  const info = {};
  for (info.i=0; info.i<patterns.length; info.i++) {
    if (name.match(patterns[info.i])) break;
  }
  if (info.i >= patterns.length) {
    return { i: -1, code: name };
  }
  info.code = name.replace(patterns[info.i], "\$1");
  return info;
};

chores.getComponentDir = function(pluginRef, componentType) {
  const compDir = lodash.get(pluginRef, ["presets", "componentDir"], {});
  if (componentType) {
    return compDir[componentType] || constx[componentType].SCRIPT_DIR;
  }
  return compDir;
};

chores.getBlockRef = function(filename, blockScope) {
  if (filename == null) return null;
  const blockName = chores.stringCamelCase(path.basename(filename, ".js"));
  blockScope = blockScope || store.defaultScope;
  if (!nodash.isArray(blockScope)) blockScope = [blockScope];
  return blockScope.concat(blockName).join(chores.getSeparator());
};

chores.getSeparator = function() {
  return store.injektorOptions.separator;
};

chores.getFullname = function(parts, separator) {
  return lodash.filter(parts, lodash.negate(lodash.isEmpty)).join(separator || chores.getSeparator());
};

chores.toFullname = function() {
  return lodash.filter(arguments, lodash.negate(lodash.isEmpty)).join(store.injektorOptions.separator);
};

chores.transformBeanName = function(name, opts) {
  opts = opts || {};
  if (typeof name !== "string") return name;
  const pattern = (opts.namePattern instanceof RegExp) ? opts.namePattern : /^(.+)\/([^:^\/]+)$/g;
  return name.replace(pattern, "$1:$2");
};

chores.lookupMethodRef = function(methodName, serviceName, proxyName, sandboxRegistry) {
  const ref = {};
  const commander = sandboxRegistry.lookupService(proxyName);
  if (commander && lodash.isFunction(commander.lookupService)) {
    ref.isDirected = false;
    ref.isRemote = true;
    ref.service = commander.lookupService(serviceName);
    if (ref.service) {
      ref.method = ref.service[methodName];
    }
  }
  if (!ref.method) {
    ref.isDirected = true;
    ref.isRemote = false;
    ref.service = sandboxRegistry.lookupService(serviceName);
    if (ref.service) {
      ref.method = ref.service[methodName];
    }
  }
  return ref;
};

chores.parseScriptTree = function (scriptType, scriptFile, scriptInstance, isHierarchical) {
  let entryPath = scriptFile.replace(".js", "").toLowerCase().split("_");
  if (entryPath.length > 0 && entryPath[0] !== constx[scriptType].ROOT_KEY) {
    entryPath.unshift(constx[scriptType].ROOT_KEY);
  }
  entryPath = entryPath.reverse();
  entryPath.unshift(scriptInstance);
  const entry = lodash.reduce(entryPath, function(result, item) {
    const nestEntry = {};
    nestEntry[item] = result;
    return nestEntry;
  });
  return entry;
};

chores.printError = function(err) {
  if (getenv(["DEVEBOT_ENV", "NODE_ENV"]) !== "test") {
    [
      "",
      "========== FATAL ERROR ==========",
      err,
      "---------------------------------",
      ""
    ].forEach(function(item) {
      console.error(item);
    });
  }
};

chores.injektorOptions = store.injektorOptions;

chores.injektorContext = store.injektorContext;

chores.isDevelopmentMode = function() {
  return ["test", "dev", "development"].indexOf(envbox.getEnv("ENV")) >= 0;
};

chores.isProductionMode = function() {
  if (envbox.getEnv("ENV") === "production") return true;
  return false;
};

chores.fatalErrorReaction = function() {
  return envbox.getEnv("FATAL_ERROR_REACTION");
};

chores.skipProcessExit = function() {
  return envbox.getEnv("SKIP_PROCESS_EXIT") === "true";
};

chores.isSilentForced = function(moduleId, cfg) {
  const fsm = envbox.getEnv("FORCING_SILENT");
  return (fsm.indexOf(moduleId) >= 0) || (cfg && cfg.verbose === false);
};

chores.isVerboseForced = function(moduleId, cfg) {
  const fvm = envbox.getEnv("FORCING_VERBOSE");
  return (fvm.indexOf(moduleId) >= 0) || !this.isSilentForced(moduleId, cfg);
};

chores.clearCache = function() {
  envbox.clearCache();
  codetags.clearCache();
  return this;
};

chores.isUpgradeSupported = codetags.isActive.bind(codetags);

chores.dateToString = function(d) {
  return d.toISOString().replace(/[:-]/g, "").replace(/[T.]/g, "-");
};

chores.getValidator = function() {
  return store.validator = store.validator || new Validator(store.validatorOptions);
};

chores.validate = function(object, schema) {
  const result = this.getValidator().validate(object, schema);
  if (typeof result.ok === "boolean") {
    result.valid = result.ok;
  }
  return result;
};

chores.argumentsToArray = function(args, l, r) {
  if (args && ((!Array.isArray(args) && args.length >= 0) || (Array.isArray(args) && (l>=0 || r>=0)))) {
    args = Array.prototype.slice.call(args, l || 0, args.length - (r || 0));
  };
  return args;
};

chores.extractObjectInfo = function(data, opts) {
  function detect (data, level=2) {
    if (typeof level !== "number" || level < 0) level = 0;
    const type = typeof(data);
    switch (type) {
      case "boolean":
      case "number":
      case "string":
      case "symbol":
      case "function":
      case "undefined": {
        return type;
      }
      case "object": {
        if (data === null) {
          return "null";
        }
        if (Array.isArray(data)) {
          const info = [];
          if (level > 0) {
            for (const i in data) {
              info.push(detect(data[i], level - 1));
            }
          }
          return info;
        } else {
          const info = {};
          if (level > 0) {
            for (const field in data) {
              info[field] = detect(data[field], level - 1);
            }
          }
          return info;
        }
        break;
      }
    }
    return undefined;
  }
  return detect(data, opts && opts.level);
};

chores.isVersionLT = function (version1, version2) {
  if (!semver.valid(version1) || !semver.valid(version2)) return null;
  return semver.lt(version1, version2);
};

chores.isVersionLTE = function (version1, version2) {
  if (!semver.valid(version1) || !semver.valid(version2)) return null;
  return semver.lte(version1, version2);
};

chores.isVersionGT = function (version1, version2) {
  if (!semver.valid(version1) || !semver.valid(version2)) return null;
  return semver.gt(version1, version2);
};

chores.isVersionGTE = function (version1, version2) {
  if (!semver.valid(version1) || !semver.valid(version2)) return null;
  return semver.gte(version1, version2);
};

chores.isVersionLessThan = chores.isVersionLT;
chores.isVersionLessThanOrEqualTo = chores.isVersionLTE;

chores.isVersionSatisfied = function (version, versionMask) {
  if (semver.valid(version)) {
    if (lodash.isString(versionMask)) {
      if (version === versionMask) return true;
      if (semver.satisfies(version, versionMask)) return true;
    }
    if (lodash.isArray(versionMask)) {
      if (versionMask.indexOf(version) >= 0) return true;
      for (const i in versionMask) {
        if (semver.satisfies(version, versionMask[i])) return true;
      }
    }
  }
  return false;
};

chores.getVersionOf = function (packageName) {
  if (packageName === "devebot") {
    const pkg = require(path.join(__dirname, "../../package.json"));
    return pkg.version;
  } else {
    let parentPath, modulePath;
    try {
      modulePath = parentPath = path.dirname(require.resolve(packageName));
    } catch (err) {
      return null;
    }
    do {
      try {
        const pkg = require(path.join(modulePath, "package.json"));
        return pkg.version;
      } catch (err) {
        parentPath = modulePath;
        modulePath = path.dirname(modulePath);
      }
    } while (modulePath !== parentPath);
    return null;
  }
};

chores.getNodeVersion = function () {
  if ("node" in process.versions) {
    return process.versions["node"];
  }
  const vstr = process.version;
  if (typeof vstr === "string") {
    return vstr.replace("v", "");
  }
  return null;
};

chores.renameJsonFields = function (data, nameMappings) {
  if (nameMappings && lodash.isObject(nameMappings)) {
    for (const oldName in nameMappings) {
      const val = lodash.get(data, oldName);
      if (!lodash.isUndefined(val)) {
        const newName = nameMappings[oldName];
        lodash.unset(data, oldName);
        lodash.set(data, newName, val);
      }
    }
  }
  return data;
};

function ServiceSelector (kwargs = {}) {
  const { serviceResolver, sandboxRegistry, binding } = kwargs;

  assert.ok(this.constructor === ServiceSelector);
  assert.ok(serviceResolver && lodash.isString(serviceResolver));
  assert.ok(sandboxRegistry && lodash.isObject(sandboxRegistry));

  let serviceResolverAvailable = true;

  this.lookup = function (serviceName, methodName) {
    const hasMethod = (typeof methodName === "string") && (methodName.length > 0);
    let ref = {};
    if (serviceResolverAvailable) {
      let resolver = sandboxRegistry.lookupService(serviceResolver);
      if (resolver) {
        ref.proxied = true;
        ref.isRemote = true; // @Deprecated
        ref.service = resolver.lookupService(serviceName);
        if (hasMethod && ref.service) {
          ref.method = ref.service[methodName];
        }
      } else {
        serviceResolverAvailable = false;
      }
    }
    if (hasMethod && !ref.method) {
      ref.proxied = false;
      ref.isRemote = false; // @Deprecated
      ref.service = sandboxRegistry.lookupService(serviceName);
      if (ref.service) {
        ref.method = ref.service[methodName];
      }
    }
    // bind the method to the service
    if (binding !== false && ref.method) {
      ref.method = ref.method.bind(ref.service);
    }
    return ref;
  };

  // @Deprecated
  this.lookupMethod = this.lookup;
}

chores.newServiceSelector = function (kwargs) {
  return new ServiceSelector(kwargs);
};

const HD_ALGORITHMS = [ "md5", "sha1", "sha256", "sha512", "ripemd160" ];
const HD_ENCODINGS = [ "hex", "base64" ];

chores.getHashDigest = function (message, { algorithm, encoding } = {}) {
  if (HD_ALGORITHMS.indexOf(algorithm) < 0) {
    algorithm = "sha1";
  }
  if (HD_ENCODINGS.indexOf(encoding) < 0) {
    encoding = "hex";
  }
  const hash = crypto.createHash(algorithm);
  const data = hash.update(message, "utf-8");
  return data.digest(encoding);
};

function newError (errorName, message, opts = {}) {
  const err = new Error(message);
  err.name = errorName;
  for (const fieldName in opts) {
    if (opts[fieldName] !== undefined) {
      err[fieldName] = opts[fieldName];
    }
  }
  return err;
}

function ErrorBuilder ({ packageName, errorCodes, defaultLanguage }) {
  const packageRef = chores.getHashDigest(packageName, { encoding: "base64" });

  this.newError = function(errorName, { payload, language } = {}) {
    language = language || defaultLanguage;
    const errInfo = errorCodes[errorName];
    if (errInfo == null) {
      return newError(errorName, "Error[" + errorName + "] unsupported", {
        packageRef,
        returnCode: -1,
        statusCode: 500
      });
    }
    let msg = errInfo.message || errorName;
    if (errInfo.messageIn && typeof language === "string") {
      msg = errInfo.messageIn[language] || msg;
    }
    if (payload && typeof payload === "object") {
      msg = chores.formatTemplate(msg, payload);
    } else {
      payload = null;
    }
    return newError(errorName, msg, {
      packageRef,
      returnCode: errInfo.returnCode,
      statusCode: errInfo.statusCode,
      payload: payload
    });
  };

  this.getDescriptor = function () {
    return { packageRef, errorCodes, defaultLanguage };
  };
}

chores.newErrorBuilder = function (kwargs) {
  return new ErrorBuilder(kwargs);
};

module.exports = chores;
