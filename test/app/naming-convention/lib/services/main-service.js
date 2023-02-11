"use strict";

const lab = require("../../../../index");
const FRWK = lab.getFramework();
const chores = FRWK.require("chores");
const lodash = FRWK.require("lodash");

const constx = require(lab.getFrameworkModule("utils/constx"));
const FRAMEWORK_NAMESPACE = constx.FRAMEWORK.NAMESPACE;

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
    chores.toFullname(FRAMEWORK_NAMESPACE + "-dp-wrapper1", "sublibService"),
    chores.toFullname(FRAMEWORK_NAMESPACE + "-dp-wrapper2", "sublibService")
  ];
}

module.exports = Service;
