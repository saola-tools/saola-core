"use strict";

let debug = null;

function pinbug (pkgName) {
  if (debug == null) {
    try {
      // eslint-disable-next-line
      debug = require("debug");
    } catch (err) {
      debug = function() {
        function log () {
          return console.info.apply(console, arguments);
        }
        log.enabled = false;
        return log;
      };
    }
  }
  // @deprecated
  debug.isEnabled = process.env.DEBUG;
  return debug(pkgName);
};

// @deprecated
pinbug.isEnabled = process.env.DEBUG;

module.exports = pinbug;
