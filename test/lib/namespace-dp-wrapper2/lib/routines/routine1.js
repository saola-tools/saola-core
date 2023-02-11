"use strict";

const Promise = FRWK.require("bluebird");

const runhookDialect = {
  info: {
    description: "namespace-dp-wrapper2/Routine1",
    options: []
  },
  handler: function(opts, payload, ctx) {
    return Promise.resolve([{
        type: "json",
        title: "namespace-dp-wrapper2 - Routine1",
        data: {}
    }]);
  }
};

module.exports = function(params) {
  return runhookDialect;
};
