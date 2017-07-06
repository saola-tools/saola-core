'use strict';

var Promise = require('bluebird');
var lodash = require('lodash');

var runhookSetting;

var runhookDialect = {
  info: {
    description: 'Plugin2 - Routine3',
    options: []
  },
  handler: function(opts, ctx) {
    return Promise.resolve([{
        type: 'json',
        title: 'Plugin2 - Routine3',
        data: {}
    }]);
  }
};

module.exports = function(params) {
  runhookSetting = params || {};
  return runhookDialect;
};