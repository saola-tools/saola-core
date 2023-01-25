/* global Devebot */
"use strict";

var lodash = Devebot.require("lodash");

function Service (params={}) {
  var L = params.loggingFactory.getLogger();

  var mainCfg = lodash.get(params, ["sandboxConfig", "application"], {});
  L.has("silly") && L.log("silly", "configuration: %s", JSON.stringify(mainCfg));
};

module.exports = Service;
