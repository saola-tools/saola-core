'use strict';

var Promise = Devebot.require('bluebird');
var chores = Devebot.require('chores');
var lodash = Devebot.require('lodash');
var http = require('http');
var util = require('util');

var Service = function(params={}) {
  var self = this;

  var LX = params.loggingFactory.getLogger();
  var LT = params.loggingFactory.getTracer();
  var packageName = params.packageName || 'state-verification';
  var blockRef = params.componentId;
  var mainCfg = lodash.get(params, ['sandboxConfig'], {});

  self.getConfig = function() {
    return lodash.cloneDeep(mainCfg);
  }

  var server = http.createServer();

  server.on('error', function(error) {
    LX.has('silly') && LX.log('silly', LT.add({ error: error }).toMessage({
      tags: [blockRef, 'webserver-error'],
      text: 'Server Error: ${error}'
    }));
  });

  server.on('request', function(req, res) {
    res.writeHead(200);
    res.end(util.format('%s webserver', packageName));
  });

  self.getServer = function() {
    return server;
  };

  var configHost = lodash.get(mainCfg, 'host', '0.0.0.0');
  var configPort = lodash.get(mainCfg, 'port', 8080);

  self.start = function() {
    return new Promise(function(resolved, rejected) {
      var serverInstance = server.listen(configPort, configHost, function () {
        var host = serverInstance.address().address;
        var port = serverInstance.address().port;
        chores.isVerboseForced(packageName, mainCfg) &&
        console.log('%s is listening at http://%s:%s', packageName, host, port);
        resolved(serverInstance);
      });
    });
  };

  self.stop = function() {
    return new Promise(function(resolved, rejected) {
      server.close(function () {
        chores.isVerboseForced(packageName, mainCfg) &&
        console.log('%s has been closed', packageName);
        resolved();
      });
    });
  };
};

if (chores.isUpgradeSupported('bridge-full-ref')) {
  Service.referenceList = [
    'application/connector1#wrapper',
    'application/connector2#wrapper',
    'devebot-dp-wrapper1/sublibTrigger',
    'devebot-dp-wrapper2/sublibTrigger'
  ]
}

module.exports = Service;
