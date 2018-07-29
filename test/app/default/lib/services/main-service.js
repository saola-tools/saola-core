'use strict';

var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');

var Service = function(params={}) {
  var LX = params.loggingFactory.getLogger();

  var mainCfg = lodash.get(params, ['sandboxConfig', 'application'], {});
  LX.has('silly') && LX.log('silly', 'configuration: %s', JSON.stringify(mainCfg));
};

module.exports = Service;
