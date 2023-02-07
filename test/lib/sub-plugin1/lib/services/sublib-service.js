"use strict";

const chores = Devebot.require("chores");

const Service = function(params = {}) {
  const { packageName, loggingFactory, sandboxConfig } = params;

  const L = loggingFactory.getLogger();
  const T = loggingFactory.getTracer();
  const blockRef = chores.getBlockRef(__filename, packageName);

  this.getConfig = function() {
    return {
      [blockRef]: sandboxConfig
    };
  };

  L && L.has("silly") && L.log("silly", T && T.add({ blockRef }).toMessage({
    tags: [ blockRef, "configuration" ],
    text: "Configuration: " + JSON.stringify(this.getConfig())
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
