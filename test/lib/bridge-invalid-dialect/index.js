'use strict';

var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');
var dgx = Devebot.require('pinbug')('devebot:test:lab:bridge-invalid-class');

var Service = function(params) {
  dgx.enabled && dgx(' + constructor start ...');

  params = params || {};
  const MY_CONST = 'BEGIN';

  dgx.enabled && dgx(' - params: %s', JSON.stringify(params, null, 2));

  this.getConfig = function() {
    return lodash.cloneDeep(params);
  }
  MY_CONST = 'END';

  dgx.enabled && dgx(' - constructor end!');
};

module.exports = Service;
