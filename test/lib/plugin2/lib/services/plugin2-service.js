//* global Devebot */
"use strict";

const Service = function(params = {}) {
  const { componentId: blockRef, loggingFactory, sandboxConfig } = params;
  const L = loggingFactory.getLogger();
  const T = loggingFactory.getTracer();

  L.has("dunce") && L.log("dunce", T.add({ sandboxConfig }).toMessage({
    tags: [ blockRef, "configuration" ],
    text: " - configuration: ${sandboxConfig}"
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
