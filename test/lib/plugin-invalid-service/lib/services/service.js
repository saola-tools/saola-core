'use strict';

var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');

var Service = function(params) {
  var self = this;
  params = params || {};

  var LX = params.loggingFactory.getLogger();
  var LT = params.loggingFactory.getTracer();

  LX.has('conlog') && LX.log('conlog', LT.toMessage({
    tags: [ 'plugin-invalid-service', 'constructor-begin' ],
    text: ' + constructor begin'
  }));

  var pluginCfg = lodash.get(params, 'sandboxConfig', {});
  LX.has('conlog') && LX.log('conlog', LT.add({
    pluginCfg: pluginCfg
  }).toMessage({
    tags: [ 'plugin-invalid-service' ],
    text: ' - configuration: {pluginCfg}'
  }));

  // invalid code
  unknownVar = 1024;

  LX.has('conlog') && LX.log('conlog', LT.toMessage({
    tags: [ 'plugin-invalid-service', 'constructor-end' ],
    text: ' - constructor end!'
  }));
};

module.exports = Service;