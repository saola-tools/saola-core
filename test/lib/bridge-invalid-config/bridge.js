/* global Devebot */
'use strict';

const lodash = Devebot.require('lodash');
const dgx = Devebot.require('pinbug')('devebot:test:lab:bridge-invalid-config');

const Service = function(params) {
  dgx.enabled && dgx(' + constructor start ...');

  params = params || {};

  dgx.enabled && dgx(' - params: %s', JSON.stringify(params, null, 2));

  this.getConfig = function() {
    return lodash.cloneDeep(params);
  }

  dgx.enabled && dgx(' - constructor end!');
};

module.exports = Service;

Service.metadata = require('./metadata');
