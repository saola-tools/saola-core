"use strict";

const Promise = Devebot.require("bluebird");

const runhookDialect = {
  info: {
    description: "sub-plugin1/Routine0",
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

    L.has("dunce") && L.log("dunce", T.add({
      checkpoint: "sub-plugin1-routine0-begin"
    }).toMessage({
      tags: ["sub-plugin1", "routine0", "begin"],
      text: " - runhook begin"
    }));

    const number = payload.number;
    const result = fibonacci(number, number, ctx.progressMeter);

    const output = Promise.resolve([{
        type: "json",
        title: "sub-plugin1 - Routine0",
        data: { fibonacci: result }
    }]);

    L.has("dunce") && L.log("dunce", T.add({
      checkpoint: "sub-plugin1-routine0-end"
    }).toMessage({
      tags: ["sub-plugin1", "routine0", "end"],
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
