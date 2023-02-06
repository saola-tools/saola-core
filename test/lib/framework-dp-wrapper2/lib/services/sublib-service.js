/* global Devebot */
"use strict";

const chores = Devebot.require("chores");
const lodash = Devebot.require("lodash");

const Service = function(params) {
  params = params || {};

  const packageName = params.packageName || "devebot-dp-wrapper2";
  const blockRef = chores.getBlockRef(__filename, packageName);
  const L = params.loggingFactory.getLogger();
  const T = params.loggingFactory.getTracer();

  L.has("silly") && L.log("silly", T.toMessage({
    tags: [blockRef, "constructor-begin"],
    text: " + constructor begin ..."
  }));

  const pluginCfg = lodash.get(params, ["sandboxConfig"], {});

  this.getConfig = function() {
    return pluginCfg;
  };

  L.has("silly") && L.log("silly", T.toMessage({
    tags: [blockRef, "constructor-end"],
    text: " + constructor end!"
  }));
};

Service.argumentSchema = {
  "$id": "sublibService",
  "type": "object",
  "properties": {
    "sublibTrigger": {
      "type": "object"
    }
  }
};

module.exports = Service;
