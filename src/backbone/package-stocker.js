"use strict";

function PackageStocker (params = {}) {
  this._store_ = {};

  this._store_.popularPackages = params.popularPackages || [];
  this._store_.builtinPackages = params.builtinPackages || [];
  this._store_.internalModules = params.internalModules || {};
  this._store_.externalModules = {};

  this._store_.predefinedModuleNames = _getPredefinedModuleNames.bind(this)();

  this.declare = function(packageInfo) {
    const { externalModules } = this && this._store_ || {};
    //
    packageInfo = _transformPackageInfo(packageInfo);
    //
    if (_requirePredefinedPackage.bind(this)(packageInfo.name) != null) {
      return this;
    }
    //
    externalModules[packageInfo.name] = packageInfo.location || packageInfo.name;
    //
    return this;
  };
  //
  this.require = function(packageName) {
    const { externalModules } = this && this._store_ || {};
    if (externalModules && packageName in externalModules) {
      return _require(externalModules[packageName]);
    }
    return _requirePredefinedPackage.bind(this)(packageName);
  };
  //
  this.reset = function() {
    const { externalModules } = this && this._store_ || {};
    _unloadPackageHash(externalModules);
  };
  //
  this.modules = new Proxy(this, {
    get: function(target, name) {
      return target.require(name);
    },
    ownKeys (target) {
      const { predefinedModuleNames, externalModules } = target._store_;
      return [].concat(predefinedModuleNames, Object.keys(externalModules));
    },
    getOwnPropertyDescriptor (target, prop) {
      const { predefinedModuleNames, externalModules } = target._store_;
      const available = predefinedModuleNames.indexOf(prop) >= 0 || prop in externalModules;
      return {
        enumerable: available,
        configurable: available
      };
    }
  });
}

function _transformPackageInfo (packageInfo) {
  if (_isEmpty(packageInfo)) {
    throw _newError("PackageInfoNullError", {message: "packageInfo must be not empty"});
  }
  //
  if (_isString(packageInfo)) {
    packageInfo = { name: packageInfo };
  }
  //
  if (!_isObject(packageInfo)) {
    throw _newError("InvalidPackageInfoError", {message: "packageInfo must be an object"});
  }
  //
  packageInfo = _pick(packageInfo, ["name", "location", "preload", "override"]);
  //
  if (!_isString(packageInfo.name)) {
    throw _newError("InvalidPackageNameError", {message: "packageName must be a string"});
  }
  //
  return packageInfo;
}

function _isEmpty (o) {
  if (o === undefined || o === null) {
    return true;
  }
  if (_isString(o) && o.length === 0) {
    return true;
  }
  if (_isObject(o) && Object.keys(o).length === 0) {
    return true;
  }
  return false;
}

function _isArray (o) {
  return o instanceof Array;
}

function _isObject (o) {
  return typeof o === "object" && !_isArray(o);
}

function _isString (s) {
  return typeof s === "string";
}

function _pick (obj, names) {
  if (!_isObject(obj)) {
    return {};
  }
  if (!_isArray(names)) {
    return obj;
  }
  const sel = {};
  for (const name of names) {
    if (name in obj) {
      sel[name] = obj[name];
    }
  }
  return sel;
}

function _getPredefinedModuleNames () {
  const { popularPackages, builtinPackages, internalModules } = this && this._store_ || {};
  return [].concat(popularPackages, builtinPackages, Object.keys(internalModules));
}

function _requirePredefinedPackage (packageName) {
  const { popularPackages, builtinPackages, internalModules } = this && this._store_ || {};
  if (popularPackages && popularPackages.indexOf(packageName) >= 0) {
    return _require(packageName);
  }
  if (builtinPackages && builtinPackages.indexOf(packageName) >= 0) {
    return _require(packageName);
  }
  if (internalModules && packageName in internalModules) {
    return _require(internalModules[packageName]);
  }
  return null;
}

function _require (packageName) {
  return require(packageName);
}

function _unloadPackageHash (packages) {
  for (let packageName in packages) {
    _unload(packages[packageName]);
    if (packages.hasOwnProperty(packageName)) {
      delete packages[packageName];
    }
  }
}

function _unload (module, stack) {
  stack = stack || [];
  const path = require.resolve(module);
  //
  if (require.cache[path] && require.cache[path].children) {
    require.cache[path].children.forEach(function (child) {
      if (!stack.includes(child.id)) {
        stack.push(path);
        _unload(child.id, stack);
      }
    });
  }
  //
  return delete require.cache[path];
}

function _newError (name, {message, payload} = {}) {
  const err = new Error(message);
  err.name = name;
  if (payload) {
    err.payload = payload;
  }
  return err;
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ default instance

const path = require("path");

const popularPackages = ["bluebird", "lodash", "semver"];
const builtinPackages = ["injektor", "logolite", "schemato", "envcloak", "codetags"];
const internalModules = {
  chores: path.join(__dirname, "../utils/", "chores"),
  loader: path.join(__dirname, "../utils/", "loader"),
  portlet: path.join(__dirname, "../utils/", "portlet"),
  pinbug: path.join(__dirname, "../utils/", "pinbug"),
  debug: path.join(__dirname, "../utils/", "debug"),
  errors: path.join(__dirname, "../utils/", "errors"),
};

let packageStocker;

Object.defineProperty(PackageStocker, "instance", {
  get: function() {
    return (packageStocker = packageStocker || new PackageStocker({
      popularPackages, builtinPackages, internalModules,
    }));
  }
});

module.exports = PackageStocker;
