/* global Devebot */
"use strict";

const lodash = Devebot.require("lodash");
const devlog = Devebot.require("pinbug")("devebot:test:lab:bridge-invalid-booter");

/* eslint-disable no-unused-vars */
const MY_CONST = "BEGIN";

function Service (params) {
  devlog.enabled && devlog(" + constructor start ...");

  params = params || {};

  devlog.enabled && devlog(" - params: %s", JSON.stringify(params, null, 2));

  this.getConfig = function() {
    return lodash.cloneDeep(params);
  };

  devlog.enabled && devlog(" - constructor end!");
};

/* eslint-disable no-const-assign */
MY_CONST = "END";

module.exports = Service;
