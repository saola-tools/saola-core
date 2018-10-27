'use strict';

var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');

var Service = function(params={}) {
  var L = params.loggingFactory.getLogger();

  var mainCfg = lodash.get(params, ['sandboxConfig', 'application'], {});
  L.has('silly') && L.log('silly', 'configuration: %s', JSON.stringify(mainCfg));
};

module.exports = Service;
