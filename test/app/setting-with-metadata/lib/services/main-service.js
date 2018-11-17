'use strict';

var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');

var Service = function(params={}) {
  var L = params.loggingFactory.getLogger();

  var mainCfg = lodash.get(params, ['sandboxConfig'], {});
  L.has('silly') && L.log('silly', 'configuration: %s', JSON.stringify(mainCfg));

  console.log('Service1 config: ', params.service1.getConfig());
  console.log('Service2 config: ', params.service2.getConfig());
};

Service.referenceHash = {
  "service1": "sub-plugin1/sublibService",
  "service2": "sub-plugin2/sublibService"
}

module.exports = Service;
