"use strict";

const lodash = FRWK.require("lodash");
const devlog = FRWK.require("pinbug")("devteam:test:app:invalid-plugin-booter:mainService");

/* eslint-disable no-unused-vars */
const MODULE_NAME = "invalid-plugin-booter/mainService";

const Service = function(params) {
  devlog.enabled && devlog(" + constructor begin ...");

  const mainCfg = lodash.get(params, "sandboxConfig", {});
  devlog.enabled && devlog("configuration: %s", JSON.stringify(mainCfg));

  devlog.enabled && devlog(" - constructor end!");
};

/* eslint-disable no-const-assign */
MODULE_NAME = "unknown";

module.exports = Service;
