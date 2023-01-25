/* global Devebot */
"use strict";

const assert = require("assert");
const chores = Devebot.require("chores");
const lodash = Devebot.require("lodash");
const debugx = Devebot.require("pinbug")("devebot:test:lab:main:mainService");

const Service = function(params={}) {
  const L = params.loggingFactory.getLogger();
  const T = params.loggingFactory.getTracer();

  const mainCfg = lodash.get(params, ["sandboxConfig", "application"], {});
  debugx.enabled && debugx("configuration: %s", JSON.stringify(mainCfg));

  if (chores.isUpgradeSupported("bridge-full-ref")) {
    const anyname1zCaseA = params[chores.toFullname("application", "bridge1#anyname1z")];
    const anyname1zCaseB = params[chores.toFullname("bridge1#anyname1z")];

    assert.strict.equal(anyname1zCaseA, anyname1zCaseB);
    assert.strict.deepEqual(anyname1zCaseA.getConfig(), anyname1zCaseB.getConfig());
  }
};

if (chores.isUpgradeSupported("bridge-full-ref")) {
  Service.referenceList = [
    chores.toFullname("bridge1#anyname1z"),
    chores.toFullname("application", "bridge1#anyname1z"),
    chores.toFullname("plugin1", "bridge1#anyname1a"),
    chores.toFullname("plugin1", "bridge2#anyname2a")
  ];
}

module.exports = Service;
