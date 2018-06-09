'use strict';

var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');

var Service = function(params) {
  var self = this;
  params = params || {};

  var LX = params.loggingFactory.getLogger();
  var LT = params.loggingFactory.getTracer();

  var pluginCfg = lodash.get(params, ['sandboxConfig'], {});
  LX.has('conlog') && LX.log('conlog', LT.add({
    pluginCfg: pluginCfg
  }).toMessage({
    tags: [ 'plugin2', 'configuration' ],
    text: ' - configuration: {pluginCfg}'
  }));
};

Service.argumentSchema = {
  "$id": "plugin2Service",
  "type": "object",
  "properties": {
    "sandboxName": {
      "type": "string"
    },
    "sandboxConfig": {
      "type": "object"
    },
    "profileConfig": {
      "type": "object"
    },
    "loggingFactory": {
      "type": "object"
    }
  }
};

module.exports = Service;
