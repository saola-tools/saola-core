'use strict';

var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');
var dgx = Devebot.require('pinbug')('devebot:test:lab:bridge-kebab-case2');

var Service = function(params) {
  dgx.enabled && dgx(' + constructor start ...');

  params = params || {};

  var L = this.logger, T = this.tracer;

  L.has('debug') && L.log('debug', T.add({ data: params }).toMessage({
    tags: [ 'bridge-kebab-case2', 'configuration' ],
    message: 'Configuration: ${data}'
  }));

  this.getConfig = function() {
    return lodash.cloneDeep(params);
  }

  dgx.enabled && dgx(' - constructor end!');
};

module.exports = Service;
