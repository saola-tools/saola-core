/* global Devebot */
"use strict";

const chores = Devebot.require("chores");
const lodash = Devebot.require("lodash");

const Service = function(params = {}) {
  const packageName = params.packageName || "plugin-invalid-service";
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

  /* eslint-disable no-undef */
  unknownconst = 1024; // invalid code

  L.has("dunce") && L.log("dunce", T.toMessage({
    tags: [ blockRef, "constructor-end" ],
    text: " - constructor end!"
  }));
};

module.exports = Service;
