"use strict";

const lodash = FRWK.require("lodash");
const debugx = FRWK.require("pinbug")("devteam:test:lib:plugin1:plugin1Service");

const Service = function(params = {}) {
  debugx.enabled && debugx(" + constructor begin ...");

  const pluginCfg = lodash.get(params, ["sandboxConfig"], {});
  debugx.enabled && debugx("configuration: %s", JSON.stringify(pluginCfg));

  debugx.enabled && debugx(" - constructor end!");
};

Service.argumentSchema = {
  "$id": "plugin1Service",
  "type": "object",
  "properties": {
    "sandboxName": {
      "type": "string"
    },
    "sandboxConfig": {
      "type": "object"
    },
    "profileConfig": {
      "type": "object"
    },
    "loggingFactory": {
      "type": "object"
    }
  }
};

module.exports = Service;
