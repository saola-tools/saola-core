"use strict";

const Promise = FRWK.require("bluebird");

let runhookSetting;

const runhookDialect = {
  info: {
    description: "Plugin2 - Routine3",
    validate: function(data) {
      return data && data.number < 10;
    },
    options: []
  },
  handler: function(opts, payload, ctx) {
    return Promise.resolve([{
        type: "json",
        title: "Plugin2 - Routine3",
        data: {}
    }]);
  }
};

module.exports = function(params) {
  runhookSetting = params || {};
  return runhookDialect;
};
