'use strict';

var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');
var debugx = Devebot.require('pinbug')('devebot:test:lab:main:mainService');

var Service = function(params) {
  debugx.enabled && debugx(' + constructor begin ...');

  params = params || {};
  var self = this;

  var L = params.loggingFactory.getLogger();
  var T = params.loggingFactory.getTracer();

  var mainCfg = lodash.get(params, ['sandboxConfig', 'application'], {});
  debugx.enabled && debugx('configuration: %s', JSON.stringify(mainCfg));

  debugx.enabled && debugx(' - constructor end!');
};

module.exports = Service;
