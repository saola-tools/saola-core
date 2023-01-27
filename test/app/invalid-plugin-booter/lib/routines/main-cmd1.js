/* global Devebot */
"use strict";

const Promise = Devebot.require("bluebird");

const commandObject = {
  info: {
    description: "Main Application Command1",
    options: []
  },
  handler: function(opts, payload, ctx) {
    return Promise.resolve([{
        type: "json",
        title: "Main Application Command1",
        data: {}
    }]);
  }
};

module.exports = function(params) {
  return commandObject;
};
