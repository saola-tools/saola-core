"use strict";

const chores = FRWK.require("chores");
const lodash = FRWK.require("lodash");
const devlog = FRWK.require("pinbug")("devteam:test:app:invalid-plugin-config:mainService");

const Service = function(params = {}) {
  devlog.enabled && devlog(" + constructor begin ...");

  const sandboxConfig = lodash.get(params, ["sandboxConfig", "application"], {});
  const { loggingFactory, packageName } = params;

  const L = loggingFactory.getLogger();
  const T = loggingFactory.getTracer();
  const blockRef = chores.getBlockRef(__filename, packageName);

  this.getConfig = function () {
    return {
      [blockRef]: sandboxConfig,
    };
  };

  L && L.has("debug") && L.log("debug", T && T.add({ blockRef }).toMessage({
    tags: [ blockRef, "configuration" ],
    text: "Configuration: " + JSON.stringify(this.getConfig())
  }));

  devlog.enabled && devlog(" - constructor end!");
};

module.exports = Service;
