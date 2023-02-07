"use strict";

const lodash = FRWK.require("lodash");
const devlog = FRWK.require("pinbug")("devteam:test:lib:bridge-kebab-case2");

const Service = function(params) {
  devlog.enabled && devlog(" + constructor start ...");

  params = params || {};

  const L = this.logger; const T = this.tracer;

  L.has("debug") && L.log("debug", T.add({ data: params }).toMessage({
    tags: [ "bridge-kebab-case2", "configuration" ],
    message: "Configuration: ${data}"
  }));

  this.getConfig = function() {
    return lodash.cloneDeep(params);
  };

  devlog.enabled && devlog(" - constructor end!");
};

module.exports = Service;
