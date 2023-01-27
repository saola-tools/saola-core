/* global Devebot */
"use strict";

var Promise = Devebot.require("bluebird");
var lodash = Devebot.require("lodash");

var runhookSetting;

var runhookDialect = {
  info: {
    description: "sub-plugin2/Routine2",
    validate: function(data) {
      return data && data.number < 10;
    },
    options: []
  },
  handler: function(opts, payload, ctx) {
    return Promise.resolve([{
        type: "json",
        title: "sub-plugin2 - Routine2",
        data: {}
    }]);
  }
};

module.exports = function(params) {
  runhookSetting = params || {};
  return runhookDialect;
};
