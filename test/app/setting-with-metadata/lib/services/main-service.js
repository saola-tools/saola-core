'use strict';

var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');

var Service = function(params={}) {
  var L = params.loggingFactory.getLogger();

  var mainCfg = lodash.get(params, ['sandboxConfig'], {});
  L.has('silly') && L.log('silly', 'configuration: %s', JSON.stringify(mainCfg));

  this.mergeConfig = function(opts) {
    return lodash.merge({}, params.service1.getConfig(opts), params.service2.getConfig(opts));
  }

  console.log('Internal merge config: ', this.mergeConfig());
};

Service.referenceHash = {
  "service1": "sub-plugin1/sublibService",
  "service2": "sub-plugin2/sublibService"
}

module.exports = Service;
