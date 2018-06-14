'use strict';

var http = require('http');
var Promise = Devebot.require('bluebird');
var chores = Devebot.require('chores');
var lodash = Devebot.require('lodash');
var debugx = Devebot.require('pinbug')('devebot:test:lab:main:mainTrigger');

var Service = function(params) {
  debugx.enabled && debugx(' + constructor begin ...');

  params = params || {};

  var self = this;
  var packageName = params.packageName || 'fullapp';
  var mainCfg = lodash.get(params, ['sandboxConfig', 'application'], {});

  var server = http.createServer();

  server.on('error', function(err) {
    debugx.enabled && debugx('Server Error: %s', JSON.stringify(err));
  });

  server.on('request', function(req, res) {
    res.writeHead(200);
    res.end('fullapp webserver');
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

  debugx.enabled && debugx(' - constructor end!');
};

if (chores.isFeatureSupported('bridge-full-ref')) {
  Service.referenceList = [
    'application/bridge1#anyname1z',
    'application/bridge2#anyname2z',
    'connector1#wrapper',
    'connector2#wrapper',
    'plugin2/bridge1#anyname1b',
    'plugin2/bridge2#anyname2b'
  ]
}

module.exports = Service;
