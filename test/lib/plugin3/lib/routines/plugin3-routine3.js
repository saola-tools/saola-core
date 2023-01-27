/* global Devebot */
"use strict";

const Promise = Devebot.require("bluebird");

let runhookSetting;

const runhookDialect = {
  info: {
    description: "Plugin3 - Routine3",
    validate: function(data) {
      return data && data.number < 10;
    },
    options: []
  },
  handler: function(opts, payload, ctx) {
    return Promise.resolve([{
        type: "json",
        title: "Plugin3 - Routine3",
        data: {}
    }]);
  }
};

module.exports = function(params) {
  runhookSetting = params || {};
  return runhookDialect;
};
