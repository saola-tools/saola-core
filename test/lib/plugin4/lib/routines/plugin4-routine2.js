'use strict';

var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');

var runhookSetting;

var runhookDialect = {
  info: {
    description: 'Plugin4 - Routine2',
    options: []
  },
  mode: 'remote',
  handler: function(opts, payload, ctx) {
    var L = this.loggingFactory.getLogger();
    var T = this.loggingFactory.getTracer();

    L.has('conlog') && L.log('conlog', T.add({
      checkpoint: 'plugin4-routine2-begin'
    }).toMessage({
      text: ' - runhook start',
      reset: true
    }));

    var result = { runhookName: 'Plugin4 - Routine2' }

    L.has('conlog') && L.log('conlog', T.add({
      checkpoint: 'plugin4-routine2-injected-names',
      injectedServiceNames: Object.keys(this.injectedServices)
    }).toMessage({
      text: ' - injectedServices names: {injectedServiceNames}',
      reset: true
    }));

    var output = Promise.resolve([{
        type: 'json',
        title: 'Plugin4 - Routine2',
        data: {}
    }]);

    L.has('conlog') && L.log('conlog', T.add({
      checkpoint: 'plugin4-routine2-end'
    }).toMessage({
      text: ' - runhook end',
      reset: true
    }));

    return output;
  }
};

module.exports = function(params) {
  runhookSetting = params || {};
  return runhookDialect;
};
