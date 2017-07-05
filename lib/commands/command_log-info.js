'use strict';

var Promise = require('bluebird');
var chores = require('../utils/chores.js');

var commandConfig;

var commandObject = {
  info: {
    alias: 'log-info',
    description: 'Display the logger information',
    options: []
  },
  handler: function(opts, ctx) {
    var loggingFactory = chores.pickProperty('loggingFactory', [ctx, this, commandConfig], {});
    return Promise.resolve(loggingFactory.getServiceHelp());
  }
};

module.exports = function(params) {
  commandConfig = params || {};
  return commandObject;
};