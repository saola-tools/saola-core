"use strict";

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

function PackageStocker (params = {}) {
  this.require = function(packageName) {
    if (popularPackages.indexOf(packageName) >= 0) return require(packageName);
    if (builtinPackages.indexOf(packageName) >= 0) return require(packageName);
    if (packageName in internalModules) {
      return require(internalModules[packageName]);
    }
    return null;
  };
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ default instance

let packageStocker;

Object.defineProperty(PackageStocker, "instance", {
  get: function() {
    return (packageStocker = packageStocker || new PackageStocker());
  }
});

module.exports = PackageStocker;
