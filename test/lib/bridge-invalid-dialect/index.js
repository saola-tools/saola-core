"use strict";

const lodash = Devebot.require("lodash");
const devlog = Devebot.require("pinbug")("devebot:test:lab:bridge-invalid-class");

const Service = function(params) {
  devlog.enabled && devlog(" + constructor start ...");

  params = params || {};

  /* eslint-disable no-unused-vars */
  const MY_CONST = "BEGIN";

  devlog.enabled && devlog(" - params: %s", JSON.stringify(params, null, 2));

  this.getConfig = function() {
    return lodash.cloneDeep(params);
  };

  /* eslint-disable no-const-assign */
  MY_CONST = "END";

  devlog.enabled && devlog(" - constructor end!");
};

module.exports = Service;
