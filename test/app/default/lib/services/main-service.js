/* global Devebot */
"use strict";

const lodash = Devebot.require("lodash");

var Service = function(params={}) {
  const L = params.loggingFactory.getLogger();

  const mainCfg = lodash.get(params, ["sandboxConfig", "application"], {});
  L.has("silly") && L.log("silly", "configuration: %s", JSON.stringify(mainCfg));
};

module.exports = Service;
