/* global Devebot */
"use strict";

/* eslint-disable no-unused-vars */
const MODULE_NAME = "invalid-plugin-booter/mainService";

const Promise = Devebot.require("bluebird");

const commandObject = {
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
  return commandObject;
};

/* eslint-disable no-const-assign */
MODULE_NAME = "unknown";
