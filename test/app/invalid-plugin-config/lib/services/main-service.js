/* global Devebot */
"use strict";

const chores = Devebot.require("chores");
const lodash = Devebot.require("lodash");
const devlog = Devebot.require("pinbug")("devebot:test:lab:main:mainService");

const Service = function(params = {}) {
  devlog.enabled && devlog(" + constructor begin ...");

  const sandboxConfig = lodash.get(params, ["sandboxConfig", "application"], {});
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

  devlog.enabled && devlog(" - constructor end!");
};

module.exports = Service;
