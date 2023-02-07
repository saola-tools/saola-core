"use strict";

const lodash = FRWK.require("lodash");

const Service = function(params={}) {
  const L = params.loggingFactory.getLogger();
  const T = params.loggingFactory.getTracer();

  const sandboxConfig = lodash.get(params, ["sandboxConfig", "application"], {});

  L && L.has("info") && L.log("info", T && T.toMessage({
    text: "Configuration: " + JSON.stringify(sandboxConfig)
  }));
};

module.exports = Service;
