'use strict';

var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');

var Service = function(params) {
  var self = this;
  params = params || {};

  var L = params.loggingFactory.getLogger();
  var T = params.loggingFactory.getTracer();
  var packageName = params.packageName || 'plugin3';

  var pluginCfg = lodash.get(params, ['sandboxConfig', 'plugins', 'plugin3'], {});
  L.has('conlog') && L.log('conlog', T.add({
    pluginCfg: pluginCfg
  }).toMessage({
    tags: [ packageName, 'configuration' ],
    text: ' - configuration: {pluginCfg}'
  }));
};

Service.argumentSchema = {
  "$id": "plugin3Service",
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
