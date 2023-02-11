"use strict";

/* eslint-disable no-unused-vars */
const MODULE_NAME = "plugin-invalid-booter/routine1";

const Promise = FRWK.require("bluebird");

const runhookDialect = {
  info: {
    description: "plugin-invalid-booter/Routine1",
    options: []
  },
  handler: function(opts, payload, ctx) {
    return Promise.resolve([{
        type: "json",
        title: "plugin-invalid-booter - Routine1",
        data: {}
    }]);
  }
};

module.exports = function(params) {
  return runhookDialect;
};

/* eslint-disable no-const-assign */
MODULE_NAME = "unknown";
