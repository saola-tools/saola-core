'use strict';

var assert = require('assert');
var Promise = Devebot.require('bluebird');
var chores = Devebot.require('chores');
var lodash = Devebot.require('lodash');
var debugx = Devebot.require('pinbug')('devebot:test:lab:main:mainService');

var Service = function(params={}) {
  var L = params.loggingFactory.getLogger();
  var T = params.loggingFactory.getTracer();

  var mainCfg = lodash.get(params, ['sandboxConfig', 'application'], {});

  L.has('info') && L.log('info', 'configuration: %s', JSON.stringify(mainCfg));
};

module.exports = Service;
