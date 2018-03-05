'use strict';

var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');

var Service = function(params) {
  var self = this;
  params = params || {};

  var LX = params.loggingFactory.getLogger();
  var LT = params.loggingFactory.getTracer();

  LX.has('conlog') && LX.log('conlog', LT.toMessage({
    tags: [ 'test-plugin3', 'constructor-begin' ],
    text: ' + constructor begin'
  }));

  var pluginCfg = lodash.get(params, ['sandboxConfig', 'plugins', 'plugin3'], {});
  LX.has('conlog') && LX.log('conlog', LT.add({
    pluginCfg: pluginCfg
  }).toMessage({
    tags: [ 'test-plugin3' ],
    text: ' - configuration: {pluginCfg}'
  }));

  LX.has('conlog') && LX.log('conlog', LT.toMessage({
    tags: [ 'test-plugin3', 'constructor-end' ],
    text: ' - constructor end!'
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
