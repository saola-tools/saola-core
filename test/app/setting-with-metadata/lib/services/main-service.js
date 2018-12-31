'use strict';

var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');

var Service = function(params={}) {
  var L = params.loggingFactory.getLogger();

  var mainCfg = lodash.get(params, ['sandboxConfig'], {});
  L.has('silly') && L.log('silly', 'configuration: %s', JSON.stringify(mainCfg));

  this.mergeConfig = function(opts) {
    var connect = this.forLogOnly(opts);
    connect.submethod(opts);
    try {
      return this.internalMergeConfig("How are you?", opts);
    } catch (e) {
      console.log('Error: ', e);
    }
  }

  this.forLogOnly = function() {
    return {
      submethod: function(opts) {}
    }
  }

  this.internalMergeConfig = function(name, opts) {
    return lodash.merge({},
      params.service1.getConfig(opts),
      params.service2.getConfig(opts),
      params.trigger1.getConfig(opts),
      params.trigger2.getConfig(opts),
      params.adapter.getConfig(opts),
      params.instance4.getConfig(opts));
  }

  console.log('Internal context (without LoggingProxy): ', this.mergeConfig());
};

Service.referenceHash = {
  "service1": "sub-plugin3/sublibService",
  "service2": "sub-plugin4/sublibService",
  "trigger1": "sub-plugin3/sublibTrigger",
  "trigger2": "sub-plugin4/sublibTrigger",
  "adapter": "application/adapter#instance",
  "instance4": "application/bridge4#instance",
}

module.exports = Service;
