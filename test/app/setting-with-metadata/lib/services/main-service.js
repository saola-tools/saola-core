"use strict";

const chores = FRWK.require("chores");
const lodash = FRWK.require("lodash");

const Service = function(params={}) {
  const L = params.loggingFactory.getLogger();

  const mainCfg = lodash.get(params, ["sandboxConfig"], {});
  L.has("silly") && L.log("silly", "configuration: %s", JSON.stringify(mainCfg));

  this.mergeConfig = function(opts) {
    const connect = this.forLogOnly(opts);
    connect.submethod(opts);
    try {
      return this.internalMergeConfig("How are you?", opts);
    } catch (e) {
      chores.logConsole("Error: ", e);
    }
  };

  this.forLogOnly = function() {
    return {
      submethod: function(opts) {}
    };
  };

  this.internalMergeConfig = function(name, opts) {
    return lodash.merge({},
      params.service1.getConfig(opts),
      params.service2.getConfig(opts),
      params.trigger1.getConfig(opts),
      params.trigger2.getConfig(opts),
      params.adapter.getConfig(opts),
      params.instance4.getConfig(opts));
  };

  chores.logConsole("Internal context (without LoggingProxy): ", this.mergeConfig());
};

Service.referenceHash = {
  "service1": "sub-plugin3/sublibService",
  "service2": "sub-plugin4/sublibService",
  "trigger1": "sub-plugin3/sublibTrigger",
  "trigger2": "sub-plugin4/sublibTrigger",
  "adapter": "application/adapter#instance",
  "instance4": "application/bridge4#instance",
};

module.exports = Service;
