/* global Devebot */
"use strict";

const Promise = Devebot.require("bluebird");

const runhookDialect = {
  info: {
    description: "devebot-dp-wrapper2/Routine0",
    options: []
  },
  handler: function(opts, payload, ctx) {
    return Promise.resolve([{
        type: "json",
        title: "devebot-dp-wrapper2 - Routine0",
        data: {}
    }]);
  }
};

module.exports = function(params) {
  return runhookDialect;
};
