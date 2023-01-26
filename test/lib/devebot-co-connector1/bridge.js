/* global Devebot */
'use strict';

const lodash = Devebot.require('lodash');
const devlog = Devebot.require('pinbug')('devebot:test:lab:devebot-co-connector1');

const Service = function(params) {
  devlog.enabled && devlog(' + constructor start ...');

  params = params || {};

  devlog.enabled && devlog(' - params: %s', JSON.stringify(params, null, 2));

  this.getConfig = function() {
    return lodash.cloneDeep(params);
  }

  devlog.enabled && devlog(' - constructor end!');
};

Service.devebotMetadata = require('./metadata');

module.exports = Service;
