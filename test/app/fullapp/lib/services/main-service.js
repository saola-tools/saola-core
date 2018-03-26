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

  var mainCfg = lodash.get(params, ['sandboxConfig', 'application'], {});
  debugx.enabled && debugx('configuration: %s', JSON.stringify(mainCfg));

  debugx.enabled && debugx(' - constructor end!');
};

if (chores.isFeatureSupported('bridge-full-ref')) {
  Service.referenceList = [
    'application/bridge1#anyname1z',
    'plugin1/bridge1#anyname1a',
    'plugin1/bridge2#anyname2a'
  ]
}

module.exports = Service;
