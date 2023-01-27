/* global Devebot */
"use strict";

const chores = Devebot.require("chores");
const lodash = Devebot.require("lodash");

/* eslint-disable no-unused-vars */
const MODULE_NAME = "plugin-invalid-booter/trigger";

const Service = function(params) {
  params = params || {};

  const packageName = params.packageName || "plugin-invalid-booter";
  const blockRef = chores.getBlockRef(__filename, packageName);
  const L = params.loggingFactory.getLogger();
  const T = params.loggingFactory.getTracer();

  L.has("dunce") && L.log("dunce", T.toMessage({
    tags: [ blockRef, "constructor-begin" ],
    text: " + constructor begin"
  }));

  const pluginCfg = lodash.get(params, "sandboxConfig", {});
  L.has("dunce") && L.log("dunce", T.add({
    pluginCfg: pluginCfg
  }).toMessage({
    tags: [ blockRef ],
    text: " - configuration: {pluginCfg}"
  }));

  L.has("dunce") && L.log("dunce", T.toMessage({
    tags: [ blockRef, "constructor-end" ],
    text: " - constructor end!"
  }));
};

/* eslint-disable no-const-assign */
MODULE_NAME = "UNKNOWN";

module.exports = Service;
