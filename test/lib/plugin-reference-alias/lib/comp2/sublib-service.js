'use strict';

var Promise = Devebot.require('bluebird');
var chores = Devebot.require('chores');
var lodash = Devebot.require('lodash');

var Service = function(params) {
  params = params || {};

  var packageName = params.packageName || 'plugin-reference-alias';
  var blockRef = chores.getBlockRef(__filename, packageName);
  var L = params.loggingFactory.getLogger();
  var T = params.loggingFactory.getTracer();

  L.has('silly') && L.log('silly', T.toMessage({
    tags: [blockRef, 'constructor-begin'],
    text: ' + constructor begin ...'
  }));

  var pluginCfg = lodash.get(params, ['sandboxConfig'], {});

  this.getConfig = function() {
    return pluginCfg;
  }

  L.has('silly') && L.log('silly', T.toMessage({
    tags: [blockRef, 'constructor-end'],
    text: ' + constructor end!'
  }));
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
