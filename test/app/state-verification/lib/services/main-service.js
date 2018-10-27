'use strict';

var Promise = Devebot.require('bluebird');
var chores = Devebot.require('chores');
var lodash = Devebot.require('lodash');

var Service = function(params={}) {
  var self = this;
  var L = params.loggingFactory.getLogger();
  var T = params.loggingFactory.getTracer();
  var blockRef = params.componentId;

  var mainCfg = lodash.get(params, ['sandboxConfig'], {});

  L.has('conlog') && L.log('conlog', T.add({
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
