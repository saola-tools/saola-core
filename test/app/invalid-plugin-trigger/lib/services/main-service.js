"use strict";

const lodash = FRWK.require("lodash");
const devlog = FRWK.require("pinbug")("devteam:test:app:invalid-plugin-trigger:mainService");

const Service = function(params) {
  devlog.enabled && devlog(" + constructor begin ...");

  params = params || {};

  const mainCfg = lodash.get(params, ["sandboxConfig"], {});
  devlog.enabled && devlog("configuration: %s", JSON.stringify(mainCfg));

  devlog.enabled && devlog(" - constructor end!");
};

module.exports = Service;
