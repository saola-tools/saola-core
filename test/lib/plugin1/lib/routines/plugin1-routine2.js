'use strict';

var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');

var runhookSetting;

var runhookDialect = {
  info: {
    description: 'Plugin1 - Routine2',
    options: []
  },
  mode: 'remote',
  handler: function(opts, payload, ctx) {
    var L = this.loggingFactory.getLogger();
    var T = this.loggingFactory.getTracer();

    L.has('dunce') && L.log('dunce', T.add({
      checkpoint: 'plugin1-routine2-begin'
    }).toMessage({
      text: ' - runhook start',
      reset: true
    }));

    var result = { runhookName: 'Plugin1 - Routine2' }

    L.has('dunce') && L.log('dunce', T.add({
      checkpoint: 'plugin1-routine2-injected-names',
      injectedServiceNames: Object.keys(this.injectedServices)
    }).toMessage({
      text: ' - injectedServices names: {injectedServiceNames}',
      reset: true
    }));

    var output = Promise.resolve([{
        type: 'json',
        title: 'Plugin1 - Routine2',
        data: {}
    }]);

    L.has('dunce') && L.log('dunce', T.add({
      checkpoint: 'plugin1-routine2-end'
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
