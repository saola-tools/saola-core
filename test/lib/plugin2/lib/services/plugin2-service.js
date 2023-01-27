/* global Devebot */
"use strict";

const Service = function(params) {
  params = params || {};

  const L = params.loggingFactory.getLogger();
  const T = params.loggingFactory.getTracer();

  const blockRef = params.componentId;
  const pluginCfg = params.sandboxConfig || {};

  L.has("dunce") && L.log("dunce", T.add({
    pluginCfg: pluginCfg
  }).toMessage({
    tags: [ blockRef, "configuration" ],
    text: " - configuration: {pluginCfg}"
  }));
};

Service.argumentSchema = {
  "$id": "plugin2Service",
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
