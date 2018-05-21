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

  debugx.enabled && debugx('my configuration: %s', JSON.stringify(mainCfg));

  debugx.enabled && debugx('addonService configuration: %s',
      JSON.stringify(params.addonService.getConfig(), null, 2));

  debugx.enabled && debugx(' - constructor end!');
};

Service.referenceList = [ 'addonService', 'mainTrigger' ]

module.exports = Service;