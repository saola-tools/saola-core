'use strict';

var assert = require('assert');
var Promise = Devebot.require('bluebird');
var chores = Devebot.require('chores');
var lodash = Devebot.require('lodash');
var debugx = Devebot.require('pinbug')('devebot:test:lab:main:mainService');

var Service = function(params={}) {
  var self = this;

  var L = params.loggingFactory.getLogger();
  var T = params.loggingFactory.getTracer();

  var mainCfg = lodash.get(params, ['sandboxConfig', 'application'], {});
  debugx.enabled && debugx('configuration: %s', JSON.stringify(mainCfg));

  if (chores.isUpgradeSupported('bridge-full-ref')) {
    var anyname1z_a = params[chores.toFullname('application', 'bridge1#anyname1z')];
    var anyname1z_b = params[chores.toFullname('bridge1#anyname1z')];

    assert.equal(anyname1z_a, anyname1z_b);
    assert.deepEqual(anyname1z_a.getConfig(), anyname1z_b.getConfig());
  }
};

if (chores.isUpgradeSupported('bridge-full-ref')) {
  Service.referenceList = [
    chores.toFullname('bridge1#anyname1z'),
    chores.toFullname('application', 'bridge1#anyname1z'),
    chores.toFullname('plugin1', 'bridge1#anyname1a'),
    chores.toFullname('plugin1', 'bridge2#anyname2a')
  ]
}

module.exports = Service;
