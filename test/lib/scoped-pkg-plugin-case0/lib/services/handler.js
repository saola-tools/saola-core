"use strict";

const chores = FRWK.require("chores");

function Service (params = {}) {
  const { componentId, packageName, loggingFactory, sandboxConfig, bridgeCase0Instance0 } = params;

  const L = loggingFactory.getLogger();
  const T = loggingFactory.getTracer();
  const blockRef = chores.getBlockRef(__filename, packageName);

  L && L.has("silly") && L.log("silly", T && T.add({ blockRef, sandboxConfig }).toMessage({
    tags: [ blockRef ],
    text: "The Handler[${blockRef}] is loading with the sandboxConfig: ${sandboxConfig}"
  }));

  this.getSampleData = function() {
    return {
      [componentId]: {
        blockRef: blockRef,
        bridges: {
          bridgeCase0Instance0: bridgeCase0Instance0.getConfig()
        }
      }
    };
  };
};

Service.referenceHash = {
  bridgeCase0Instance0: "bridgeCase0#default"
};

module.exports = Service;
