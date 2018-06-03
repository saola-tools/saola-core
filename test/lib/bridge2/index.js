'use strict';

var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');
var dgx = Devebot.require('pinbug')('devebot:test:lab:bridge2');

var Service = function(params) {
  dgx.enabled && dgx(' + constructor start ...');

  params = params || {};

  var LX = this.logger, LT = this.tracer;

  LX.has('debug') && LX.log('debug', LT.add({ data: params }).toMessage({
    tags: [ 'bridge2', 'configuration' ],
    message: 'Configuration: ${data}'
  }));

  dgx.enabled && dgx(' - params: %s', JSON.stringify(params, null, 2));

  this.getConfig = function() {
    return lodash.cloneDeep(params);
  }

  dgx.enabled && dgx(' - constructor end!');
};

module.exports = Service;
