'use strict';

var Promise = Devebot.require('bluebird');
var chores = Devebot.require('chores');
var lodash = Devebot.require('lodash');

var Service = function(params) {
  params = params || {};

  var self = this;
  var LX = params.loggingFactory.getLogger();
  var LT = params.loggingFactory.getTracer();

  var packageName = params.packageName || 'sub-plugin2';
  var blockRef = chores.getBlockRef(__filename, packageName);
  var pluginCfg = lodash.get(params, ['sandboxConfig'], {});

  this.getConfig = function() {
    return pluginCfg;
  }
};

Service.referenceList = [ 'sublibTrigger' ]

module.exports = Service;
