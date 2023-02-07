"use strict";

const chores = Devebot.require("chores");
const lodash = Devebot.require("lodash");

const Service = function(params = {}) {
  const sandboxConfig = lodash.get(params, ["sandboxConfig"], {});
  const { loggingFactory, packageName } = params;

  const L = loggingFactory.getLogger();
  const T = loggingFactory.getTracer();
  const blockRef = chores.getBlockRef(__filename, packageName);

  this.getConfig = function () {
    return {
      [blockRef]: sandboxConfig,
    };
  };

  L && L.has("debug") && L.log("debug", T && T.add({ blockRef }).toMessage({
    tags: [ blockRef, "configuration" ],
    text: "Configuration: " + JSON.stringify(this.getConfig())
  }));
};

if (chores.isUpgradeSupported("bridge-full-ref")) {
  Service.referenceList = [
    chores.toFullname("devebot-dp-wrapper1", "sublibService"),
    chores.toFullname("devebot-dp-wrapper2", "sublibService")
  ];
}

module.exports = Service;
