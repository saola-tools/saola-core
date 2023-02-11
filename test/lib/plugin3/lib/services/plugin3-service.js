"use strict";

const lodash = FRWK.require("lodash");

const Service = function(params) {
  params = params || {};

  const L = params.loggingFactory.getLogger();
  const T = params.loggingFactory.getTracer();
  const packageName = params.packageName || "plugin3";

  const pluginCfg = lodash.get(params, ["sandboxConfig", "plugins", "plugin3"], {});
  L.has("dunce") && L.log("dunce", T.add({
    pluginCfg: pluginCfg
  }).toMessage({
    tags: [ packageName, "configuration" ],
    text: " - configuration: {pluginCfg}"
  }));
};

Service.argumentSchema = {
  "$id": "plugin3Service",
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
