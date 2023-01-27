/* global Devebot */
"use strict";

const Promise = Devebot.require("bluebird");

let runhookSetting;

let runhookDialect = {
  info: {
    description: "plugin-reference-alias/Routine",
    options: []
  },
  handler: function(opts, payload, ctx) {
    return Promise.resolve([{
        type: "json",
        title: "plugin-reference-alias - Routine",
        data: {}
    }]);
  }
};

module.exports = function(params) {
  runhookSetting = params || {};
  return runhookDialect;
};
