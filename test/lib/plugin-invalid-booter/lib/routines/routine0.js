"use strict";

const Promise = FRWK.require("bluebird");

const runhookDialect = {
  info: {
    description: "plugin-invalid-booter/Routine0",
    schema: {
      "type": "object",
      "properties": {
        "number": {
          "type": "number",
          "minimum": 0,
          "maximum": 100
        }
      }
    },
    options: []
  },
  handler: function(opts, payload, ctx) {
    const L = this.loggingFactory.getLogger();
    const T = this.loggingFactory.getTracer();

    L.has("dunce") && L.log("dunce", T.toMessage({
      text: " - runhook start"
    }));

    const number = payload.number;
    const result = fibonacci(number, number, ctx.progressMeter);

    const output = Promise.resolve([{
        type: "json",
        title: "plugin-invalid-booter - Routine0",
        data: { fibonacci: result }
    }]);

    L.has("dunce") && L.log("dunce", T.toMessage({
      text: " - runhook end"
    }));

    return output;
  }
};

module.exports = function(params) {
  return runhookDialect;
};

function fibonacci (n, max, progressMeter) {
  if (progressMeter) {
    progressMeter.update(max - n + 1, max);
  }
  if (n == 0 || n == 1) { return n; } else { return fibonacci(n - 1, max, progressMeter) + fibonacci(n - 2); }
}
