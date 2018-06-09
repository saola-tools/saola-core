'use strict';

var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');

var Service = function(params) {
  params = params || {};

  var self = this;
  var LX = params.loggingFactory.getLogger();
  var LT = params.loggingFactory.getTracer();

  var packageName = params.packageName || 'plugin2';
  var blockRef = params.componentId;
  var pluginCfg = params.sandboxConfig || {};

  LX.has('conlog') && LX.log('conlog', LT.add({
    pluginCfg: pluginCfg
  }).toMessage({
    tags: [ blockRef, 'configuration' ],
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
