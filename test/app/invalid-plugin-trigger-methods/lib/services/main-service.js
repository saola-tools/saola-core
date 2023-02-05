/* global Devebot */
"use strict";

const lodash = Devebot.require("lodash");
const devlog = Devebot.require("pinbug")("test:app:invalid-plugin-trigger-methods:mainService");

const Service = function(params) {
  devlog.enabled && devlog(" + constructor begin ...");

  const mainCfg = lodash.get(params, ["sandboxConfig"], {});
  devlog.enabled && devlog("configuration: %s", JSON.stringify(mainCfg));

  devlog.enabled && devlog(" - constructor end!");
};

module.exports = Service;
