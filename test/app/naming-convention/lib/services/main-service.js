'use strict';

var Promise = Devebot.require('bluebird');
var chores = Devebot.require('chores');
var lodash = Devebot.require('lodash');
var debugx = Devebot.require('pinbug')('devebot:test:lab:main:mainService');

var Service = function(params) {
  debugx.enabled && debugx(' + constructor begin ...');

  params = params || {};

  var self = this;

  var logger = params.loggingFactory.getLogger();

  var mainCfg = lodash.get(params, ['sandboxConfig'], {});
  debugx.enabled && debugx('configuration: %s', JSON.stringify(mainCfg));

  debugx.enabled && debugx(' - constructor end!');
};

if (chores.isFeatureSupported('bridge-full-ref')) {
  Service.referenceList = [
    'devebot-dp-wrapper1/sublibService',
    'devebot-dp-wrapper2/sublibService'
  ]
}

module.exports = Service;
