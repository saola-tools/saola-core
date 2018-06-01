'use strict';

var Promise = Devebot.require('bluebird');
var chores = Devebot.require('chores');
var lodash = Devebot.require('lodash');

var Service = function(params) {
  var self = this;
  params = params || {};

  var packageName = params.packageName || 'plugin-invalid-trigger-methods';
  var blockRef = chores.getBlockRef(__filename, packageName);
  var LX = params.loggingFactory.getLogger();
  var LT = params.loggingFactory.getTracer();

  LX.has('conlog') && LX.log('conlog', LT.toMessage({
    tags: [ blockRef, 'constructor-begin' ],
    text: ' + constructor begin'
  }));

  var pluginCfg = lodash.get(params, 'sandboxConfig', {});
  LX.has('conlog') && LX.log('conlog', LT.add({
    pluginCfg: pluginCfg
  }).toMessage({
    tags: [ blockRef ],
    text: ' - configuration: {pluginCfg}'
  }));

  LX.has('conlog') && LX.log('conlog', LT.toMessage({
    tags: [ blockRef, 'constructor-end' ],
    text: ' - constructor end!'
  }));
};

module.exports = Service;
