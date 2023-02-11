"use strict";

const lab = require("../../../../index");
const FRWK = lab.getFramework();
const chores = FRWK.require("chores");
const lodash = FRWK.require("lodash");

const constx = require(lab.getFrameworkModule("utils/constx"));
const FRAMEWORK_NAMESPACE = constx.FRAMEWORK.NAMESPACE;

const Service = function(params={}) {
  const L = params.loggingFactory.getLogger();
  const T = params.loggingFactory.getTracer();
  const blockRef = params.componentId;

  const mainCfg = lodash.get(params, ["sandboxConfig"], {});

  L.has("dunce") && L.log("dunce", T.add({
    pluginCfg: mainCfg
  }).toMessage({
    tags: [ blockRef, "configuration" ],
    text: " - configuration: {pluginCfg}"
  }));

  this.getConfig = function() {
    return lodash.cloneDeep(mainCfg);
  };
};

if (chores.isUpgradeSupported("bridge-full-ref")) {
  Service.referenceList = [
    chores.toFullname(FRAMEWORK_NAMESPACE + "-dp-wrapper1", "sublibService"),
    chores.toFullname(FRAMEWORK_NAMESPACE + "-dp-wrapper2", "sublibService")
  ];
}

module.exports = Service;
