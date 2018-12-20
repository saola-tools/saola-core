'use strict';

var http = require('http');
var Promise = Devebot.require('bluebird');
var chores = Devebot.require('chores');
var lodash = Devebot.require('lodash');
var debugx = Devebot.require('pinbug')('devebot:test:lab:main:mainTrigger');

var Service = function(params) {
  params = params || {};

  var packageName = params.packageName || 'naming-convention';
  var blockRef = chores.getBlockRef(__filename, packageName);
  var L = params.loggingFactory.getLogger();
  var T = params.loggingFactory.getTracer();

  debugx.enabled && debugx(' + constructor begin ...');

  var mainCfg = lodash.get(params, ['sandboxConfig'], {});

  this.getConfig = function() {
    return lodash.cloneDeep(mainCfg);
  }

  var server = http.createServer();

  server.on('error', function(err) {
    debugx.enabled && debugx('Server Error: %s', JSON.stringify(err));
  });

  server.on('request', function(req, res) {
    res.writeHead(200);
    res.end('naming-convention webserver');
  });

  this.getServer = function() {
    return server;
  };

  var configHost = lodash.get(mainCfg, 'host', '0.0.0.0');
  var configPort = lodash.get(mainCfg, 'port', 8080);

  this.start = function() {
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

  this.stop = function() {
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

if (chores.isUpgradeSupported('bridge-full-ref')) {
  Service.referenceList = [
    chores.toFullname('application', 'connector1#wrapper'),
    chores.toFullname('application', 'connector2#wrapper'),
    chores.toFullname('devebot-dp-wrapper1', 'sublibTrigger'),
    chores.toFullname('devebot-dp-wrapper2', 'sublibTrigger')
  ]
}

module.exports = Service;
