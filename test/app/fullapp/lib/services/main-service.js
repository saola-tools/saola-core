"use strict";

const assert = require("assert");
const chores = FRWK.require("chores");
const lodash = FRWK.require("lodash");

function Service (params={}) {
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
