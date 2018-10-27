'use strict';

var Promise = Devebot.require('bluebird');
var chores = Devebot.require('chores');
var lodash = Devebot.require('lodash');
var debugx = Devebot.require('pinbug')('devebot:test:lab:main:mainService');

var Service = function(params) {
  params = params || {};
  var self = this;

  var L = params.loggingFactory.getLogger();
  var T = params.loggingFactory.getTracer();

  debugx.enabled && debugx(' + constructor begin ...');

  var mainCfg = lodash.get(params, ['sandboxConfig'], {});
  debugx.enabled && debugx('configuration: %s', JSON.stringify(mainCfg));

  self.getConfig = function() {
    return lodash.cloneDeep(mainCfg);
  }

  debugx.enabled && debugx(' - constructor end!');
};

if (chores.isUpgradeSupported('bridge-full-ref')) {
  Service.referenceList = [
    chores.toFullname('devebot-dp-wrapper1', 'sublibService'),
    chores.toFullname('devebot-dp-wrapper2', 'sublibService')
  ]
}

module.exports = Service;
