'use strict';

var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');
var dgx = Devebot.require('pinbug')('devebot:test:lab:bridge-invalid-booter');

const MY_CONST = 'BEGIN';

var Service = function(params) {
  dgx.enabled && dgx(' + constructor start ...');

  params = params || {};

  dgx.enabled && dgx(' - params: %s', JSON.stringify(params, null, 2));

  this.getConfig = function() {
    return lodash.cloneDeep(params);
  }

  dgx.enabled && dgx(' - constructor end!');
};

MY_CONST = 'END';

module.exports = Service;
