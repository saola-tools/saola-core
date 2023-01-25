/* global Devebot */
"use strict";

var Promise = Devebot.require("bluebird");

var commandConfig;

var commandObject = {
  info: {
    description: "Main Application Command2",
    options: []
  },
  handler: function(opts, payload, ctx) {
    return Promise.resolve([{
        type: "json",
        title: "Main Application Command2",
        data: {}
    }]);
  }
};

module.exports = function(params) {
  commandConfig = params || {};
  return commandObject;
};
