'use strict';

var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');
var debugx = Devebot.require('pinbug')('devebot:test:lab:sub-plugin1:sublibService');

var Service = function(params) {
  var self = this;
  params = params || {};

  debugx.enabled && debugx(' + constructor begin ...');

  var pluginCfg = lodash.get(params, ['sandboxConfig'], {});
  debugx.enabled && debugx('configuration: %s', JSON.stringify(pluginCfg));

  debugx.enabled && debugx(' - constructor end!');
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
