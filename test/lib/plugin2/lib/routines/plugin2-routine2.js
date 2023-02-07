"use strict";

const Promise = FRWK.require("bluebird");

let runhookSetting;

const runhookDialect = {
  enabled: false,
  info: {
    description: "Plugin2 - Routine2",
    options: []
  },
  handler: function(opts, payload, ctx) {
    return Promise.resolve([{
        type: "json",
        title: "Plugin2 - Routine2",
        data: {}
    }]);
  }
};

module.exports = function(params) {
  runhookSetting = params || {};
  return runhookDialect;
};
