'use strict';

var http = require('http');
var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');
var chores = Devebot.require('chores');
var debugx = Devebot.require('pinbug')('devebot:test:lab:main:mainTrigger');

var Service = function(params={}) {
  var packageName = params.packageName || 'setting-with-metadata';
  var mainCfg = params.sandboxConfig || {};

  console.log('External merge config: ', params.mainService.mergeConfig({
    reqId: chores.getUUID()
  }));

  var server = http.createServer();

  server.on('error', function(err) {
    debugx.enabled && debugx('Server Error: %s', JSON.stringify(err));
  });

  this.getServer = function() {
    return server;
  };

  var configHost = lodash.get(mainCfg, ['server', 'host'], '0.0.0.0');
  var configPort = lodash.get(mainCfg, ['server', 'port'], 8080);

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
};

Service.referenceHash = {
  "dialect": "application/bridge4#instance",
  "mainService": "application/mainService"
}

module.exports = Service;
