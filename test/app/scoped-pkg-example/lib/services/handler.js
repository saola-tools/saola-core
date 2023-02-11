"use strict";

const chores = FRWK.require("chores");
const lodash = FRWK.require("lodash");

function Service (params={}) {
  const { packageName, loggingFactory, sandboxConfig } = params;

  const L = loggingFactory.getLogger();
  const T = loggingFactory.getTracer();
  const blockRef = chores.getBlockRef(__filename, packageName);

  this.getConfig = function () {
    return {
      [blockRef]: sandboxConfig,
    };
  };

  L.has("silly") && L.log("silly", "configuration: %s", JSON.stringify(sandboxConfig));
};

module.exports = Service;
