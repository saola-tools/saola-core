'use strict';

var http = require('http');
var Promise = Devebot.require('bluebird');
var chores = Devebot.require('chores');
var lodash = Devebot.require('lodash');
var debugx = Devebot.require('pinbug')('devebot:test:lab:main:mainTrigger');

var Service = function(params) {
  params = params || {};
  var self = this;

  var LX = params.loggingFactory.getLogger();
  var LT = params.loggingFactory.getTracer();

  debugx.enabled && debugx(' + constructor begin ...');

  var mainCfg = lodash.get(params, ['sandboxConfig'], {});

  self.getConfig = function() {
    return lodash.cloneDeep(mainCfg);
  }

  var server = http.createServer();

  server.on('error', function(err) {
    debugx.enabled && debugx('Server Error: %s', JSON.stringify(err));
  });

  server.on('request', function(req, res) {
    res.writeHead(200);
    res.end('state-verification webserver');
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
        chores.isVerboseForced('state-verification', mainCfg) &&
        console.log('%s is listening at http://%s:%s', Service.argumentSchema.$id, host, port);
        resolved(serverInstance);
      });
    });
  };

  self.stop = function() {
    return new Promise(function(resolved, rejected) {
      server.close(function () {
        chores.isVerboseForced('state-verification', mainCfg) &&
        console.log('%s has been closed', Service.argumentSchema.$id);
        resolved();
      });
    });
  };

  debugx.enabled && debugx(' - constructor end!');
};

if (chores.isFeatureSupported('bridge-full-ref')) {
  Service.referenceList = [
    'application/connector1#wrapper',
    'application/connector2#wrapper',
    'devebot-dp-wrapper1/sublibTrigger',
    'devebot-dp-wrapper2/sublibTrigger'
  ]
}

module.exports = Service;
