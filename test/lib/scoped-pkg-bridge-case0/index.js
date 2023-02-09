"use strict";

const lab = require("../../index");
const FRWK = lab.getFramework();
const lodash = FRWK.require("lodash");

function Service (params = {}) {
  const { logger: L, tracer: T } = this || {};

  L && L.has("debug") && L.log("debug", T && T.add({ data: params }).toMessage({
    tags: [ lab.getPrefixScopedName() + "bridge-case0", "configuration" ],
    message: "Configuration: ${data}"
  }));

  this.getConfig = function() {
    return {
      config: lodash.cloneDeep(params)
    };
  };
};

module.exports = Service;
