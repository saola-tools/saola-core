'use strict';

var assert = require('assert');
var Promise = Devebot.require('bluebird');
var chores = Devebot.require('chores');
var lodash = Devebot.require('lodash');
var debugx = Devebot.require('pinbug')('devebot:test:lab:main:mainService');

var Service = function(params={}) {
  var self = this;

  var LX = params.loggingFactory.getLogger();
  var TR = params.loggingFactory.getTracer();

  var mainCfg = lodash.get(params, ['sandboxConfig', 'application'], {});

  LX.has('info') && LX.log('info', 'configuration: %s', JSON.stringify(mainCfg));
};

module.exports = Service;
