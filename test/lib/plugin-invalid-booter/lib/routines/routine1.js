'use strict';

const MODULE_NAME = 'plugin-invalid-booter/routine1';

var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');

var runhookSetting;

var runhookDialect = {
  info: {
    description: 'plugin-invalid-booter/Routine1',
    options: []
  },
  handler: function(opts, payload, ctx) {
    return Promise.resolve([{
        type: 'json',
        title: 'plugin-invalid-booter - Routine1',
        data: {}
    }]);
  }
};

module.exports = function(params) {
  runhookSetting = params || {};
  return runhookDialect;
};

MODULE_NAME = 'unknown';
