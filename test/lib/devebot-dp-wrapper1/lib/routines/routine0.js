'use strict';

var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');

var runhookSetting;

var runhookDialect = {
  info: {
    description: 'devebot-dp-wrapper1/Routine0',
    options: []
  },
  handler: function(opts, payload, ctx) {
    return Promise.resolve([{
        type: 'json',
        title: 'devebot-dp-wrapper1 - Routine0',
        data: {}
    }]);
  }
};

module.exports = function(params) {
  runhookSetting = params || {};
  return runhookDialect;
};
