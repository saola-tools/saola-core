"use strict";

const lodash = FRWK.require("lodash");
const devlog = FRWK.require("pinbug")("devteam:test:lib:namespace-co-connector2");

const Service = function(params) {
  devlog.enabled && devlog(" + constructor start ...");

  params = params || {};

  devlog.enabled && devlog(" - params: %s", JSON.stringify(params, null, 2));

  this.getConfig = function() {
    return lodash.cloneDeep(params);
  };

  devlog.enabled && devlog(" - constructor end!");
};

Service.metadata = require("./metadata");

module.exports = Service;
