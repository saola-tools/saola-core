'use strict';

var Promise = Devebot.require('bluebird');
var chores = Devebot.require('chores');
var lodash = Devebot.require('lodash');

var Service = function(params) {
  var self = this;
  params = params || {};

  var packageName = params.packageName || 'sub-plugin2';
  var blockRef = chores.getBlockRef(__filename, packageName);
  var LX = params.loggingFactory.getLogger();
  var LT = params.loggingFactory.getTracer();

  LX.has('silly') && LX.log('silly', LT.toMessage({
    tags: [blockRef, 'constructor-begin'],
    text: ' + constructor begin ...'
  }));

  var pluginCfg = lodash.get(params, ['sandboxConfig'], {});

  this.getConfig = function() {
    return pluginCfg;
  }

  LX.has('silly') && LX.log('silly', LT.toMessage({
    tags: [blockRef, 'constructor-end'],
    text: ' + constructor end!'
  }));
};

Service.referenceList = [ 'sublibTrigger' ]

module.exports = Service;
