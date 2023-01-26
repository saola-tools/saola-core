/* global Devebot */
"use strict";

const chores = Devebot.require("chores");
const lodash = Devebot.require("lodash");

const Service = function(params = {}) {
  const L = params.loggingFactory.getLogger();
  const T = params.loggingFactory.getTracer();

  const mainCfg = lodash.get(params, ["sandboxConfig"], {});

  this.getConfig = function() {
    return lodash.cloneDeep(mainCfg);
  };
};

if (chores.isUpgradeSupported("bridge-full-ref")) {
  Service.referenceList = [
    chores.toFullname("devebot-dp-wrapper1", "sublibService"),
    chores.toFullname("devebot-dp-wrapper2", "sublibService")
  ];
}

module.exports = Service;
