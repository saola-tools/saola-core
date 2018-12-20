'use strict';

var Promise = Devebot.require('bluebird');
var chores = Devebot.require('chores');
var lodash = Devebot.require('lodash');

const MODULE_NAME = 'plugin-invalid-booter/trigger';

var Service = function(params) {
  params = params || {};

  var packageName = params.packageName || 'plugin-invalid-booter';
  var blockRef = chores.getBlockRef(__filename, packageName);
  var L = params.loggingFactory.getLogger();
  var T = params.loggingFactory.getTracer();

  L.has('dunce') && L.log('dunce', T.toMessage({
    tags: [ blockRef, 'constructor-begin' ],
    text: ' + constructor begin'
  }));

  var pluginCfg = lodash.get(params, 'sandboxConfig', {});
  L.has('dunce') && L.log('dunce', T.add({
    pluginCfg: pluginCfg
  }).toMessage({
    tags: [ blockRef ],
    text: ' - configuration: {pluginCfg}'
  }));

  L.has('dunce') && L.log('dunce', T.toMessage({
    tags: [ blockRef, 'constructor-end' ],
    text: ' - constructor end!'
  }));
};

MODULE_NAME = 'UNKNOWN';

module.exports = Service;
