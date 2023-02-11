"use strict";

const Promise = FRWK.require("bluebird");

const runhookDialect = {
  info: {
    description: "sub-plugin1/Routine1",
    options: []
  },
  handler: function(opts, payload, ctx) {
    return Promise.resolve([{
        type: "json",
        title: "sub-plugin1 - Routine1",
        data: {}
    }]);
  }
};

module.exports = function(params) {
  return runhookDialect;
};
