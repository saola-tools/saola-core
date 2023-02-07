"use strict";

const Promise = Devebot.require("bluebird");

let runhookSetting;

const runhookDialect = {
  enabled: false,
  info: {
    description: "Plugin3 - Routine2",
    options: []
  },
  handler: function(opts, payload, ctx) {
    return Promise.resolve([{
        type: "json",
        title: "Plugin3 - Routine2",
        data: {}
    }]);
  }
};

module.exports = function(params) {
  runhookSetting = params || {};
  return runhookDialect;
};
