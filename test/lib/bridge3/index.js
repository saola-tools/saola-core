'use strict';

var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');
var dgx = Devebot.require('pinbug')('devebot:test:lab:bridge3');

var Service = function(params) {
  dgx.enabled && dgx(' + constructor start ...');

  params = params || {};

  dgx.enabled && dgx(' - params: %s', JSON.stringify(params, null, 2));

  dgx.enabled && dgx(' - constructor end!');
};

module.exports = Service;