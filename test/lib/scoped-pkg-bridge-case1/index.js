/* global Devebot */
"use strict";

const lodash = Devebot.require("lodash");

function Service (params = {}) {
  const { logger: L, tracer: T } = this || {};

  L && L.has("debug") && L.log("debug", T && T.add({ data: params }).toMessage({
    tags: [ "@devebot/bridge-case1", "configuration" ],
    message: "Configuration: ${data}"
  }));

  this.getConfig = function() {
    return {
      config: lodash.cloneDeep(params)
    };
  };
};

module.exports = Service;
