/* global Devebot */
"use strict";

const lodash = Devebot.require("lodash");
const devlog = Devebot.require("pinbug")("devebot:test:lab:main:mainService");

const Service = function(params) {
  devlog.enabled && devlog(" + constructor begin ...");

  params = params || {};

  const mainCfg = lodash.get(params, ["sandboxConfig"], {});
  devlog.enabled && devlog("configuration: %s", JSON.stringify(mainCfg));

  devlog.enabled && devlog(" - constructor end!");
};

module.exports = Service;
