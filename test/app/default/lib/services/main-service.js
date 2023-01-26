/* global Devebot */
"use strict";

const chores = Devebot.require("chores");
const lodash = Devebot.require("lodash");

function Service (params={}) {
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
};

module.exports = Service;
