"use strict";

const chores = FRWK.require("chores");

function Service (params = {}) {
  const { packageName, loggingFactory, sandboxConfig } = params;

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
};

module.exports = Service;
