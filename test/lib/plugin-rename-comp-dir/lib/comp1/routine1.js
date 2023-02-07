"use strict";

const Promise = Devebot.require("bluebird");

let runhookSetting;

let runhookDialect = {
  info: {
    description: "plugin-rename-comp-dir/Routine1",
    options: []
  },
  handler: function(opts, payload, ctx) {
    return Promise.resolve([{
        type: "json",
        title: "plugin-rename-comp-dir - Routine1",
        data: {}
    }]);
  }
};

module.exports = function(params) {
  runhookSetting = params || {};
  return runhookDialect;
};
