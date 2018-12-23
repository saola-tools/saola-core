'use strict';

var Promise = Devebot.require('bluebird');
var chores = Devebot.require('chores');
var lodash = Devebot.require('lodash');

var Service = function(params) {
  params = params || {};

  var L = params.loggingFactory.getLogger();
  var T = params.loggingFactory.getTracer();

  var packageName = params.packageName || 'sub-plugin3';
  var blockRef = chores.getBlockRef(__filename, packageName);
  var pluginCfg = lodash.get(params, ['sandboxConfig'], {});

  this.getConfig = function() {
    return pluginCfg;
  }
};

Service.argumentSchema = {
  "$id": "sublibService",
  "type": "object",
  "properties": {
    "sublibTrigger": {
      "type": "object"
    }
  }
}

module.exports = Service;
