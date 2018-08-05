'use strict';

var Promise = Devebot.require('bluebird');
var chores = Devebot.require('chores');
var lodash = Devebot.require('lodash');

var Service = function(params={}) {
  var self = this;
  var LX = params.loggingFactory.getLogger();
  var LT = params.loggingFactory.getTracer();
  var blockRef = params.componentId;

  var mainCfg = lodash.get(params, ['sandboxConfig'], {});

  LX.has('conlog') && LX.log('conlog', LT.add({
    pluginCfg: mainCfg
  }).toMessage({
    tags: [ blockRef, 'configuration' ],
    text: ' - configuration: {pluginCfg}'
  }));

  self.getConfig = function() {
    return lodash.cloneDeep(mainCfg);
  }
};

if (chores.isUpgradeSupported('bridge-full-ref')) {
  Service.referenceList = [
    chores.toFullname('devebot-dp-wrapper1', 'sublibService'),
    chores.toFullname('devebot-dp-wrapper2', 'sublibService')
  ]
}

module.exports = Service;
