'use strict';

var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');
var debugx = Devebot.require('pinbug')('devebot:test:lab:plugin4:plugin4Service');

var Service = function(params) {
  params = params || {};
  var pluginCfg = lodash.get(params, ['sandboxConfig'], {});
  debugx.enabled && debugx('configuration: %s', JSON.stringify(pluginCfg));
};

module.exports = Service;
