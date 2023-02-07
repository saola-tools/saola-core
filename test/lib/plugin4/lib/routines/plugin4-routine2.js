"use strict";

const Promise = Devebot.require("bluebird");

let runhookSetting;

const runhookDialect = {
  info: {
    description: "Plugin4 - Routine2",
    options: []
  },
  mode: "remote",
  handler: function(opts, payload, ctx) {
    const L = this.loggingFactory.getLogger();
    const T = this.loggingFactory.getTracer();

    L.has("dunce") && L.log("dunce", T.add({
      checkpoint: "plugin4-routine2-begin"
    }).toMessage({
      text: " - runhook start",
      reset: true
    }));

    const result = { runhookName: "Plugin4 - Routine2" };

    L.has("dunce") && L.log("dunce", T.add({
      checkpoint: "plugin4-routine2-injected-names",
      injectedServiceNames: Object.keys(this.injectedServices)
    }).toMessage({
      text: " - injectedServices names: {injectedServiceNames}",
      reset: true
    }));

    const output = Promise.resolve([{
        type: "json",
        title: "Plugin4 - Routine2",
        data: result
    }]);

    L.has("dunce") && L.log("dunce", T.add({
      checkpoint: "plugin4-routine2-end"
    }).toMessage({
      text: " - runhook end",
      reset: true
    }));

    return output;
  }
};

module.exports = function(params) {
  runhookSetting = params || {};
  return runhookDialect;
};
