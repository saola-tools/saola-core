"use strict";

const Promise = FRWK.require("bluebird");

let runhookSetting;

const runhookDialect = {
  info: {
    description: "Plugin4 - Routine1",
    options: []
  },
  mode: "direct",
  handler: function(opts, payload, ctx) {
    const L = this.loggingFactory.getLogger();
    const T = this.loggingFactory.getTracer();

    L.has("dunce") && L.log("dunce", T.add({
      checkpoint: "plugin4-routine1-begin"
    }).toMessage({
      text: " - runhook start",
      reset: true
    }));

    const result = { runhookName: "Plugin4 - Routine1" };

    L.has("dunce") && L.log("dunce", T.add({
      checkpoint: "plugin4-routine1-injected-names",
      injectedServiceNames: Object.keys(this.injectedServices)
    }).toMessage({
      text: " - injectedServices names: {injectedServiceNames}",
      reset: true
    }));

    const output = Promise.resolve([{
        type: "json",
        title: "Plugin4 - Routine1",
        data: result
    }]);

    L.has("dunce") && L.log("dunce", T.add({
      checkpoint: "plugin4-routine1-end"
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
