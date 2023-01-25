/* global Devebot */
'use strict';

var http = require('http');
var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');
var chores = Devebot.require('chores');
var debugx = Devebot.require('pinbug')('devebot:test:lab:main:mainTrigger');

var Service = function(params={}) {
  var packageName = params.packageName || 'demo-app';
  var mainCfg = lodash.get(params, ['sandboxConfig', 'application'], {});

  var server = http.createServer();

  server.on('error', function(err) {
    debugx.enabled && debugx('Server Error: %s', JSON.stringify(err));
  });

  this.getServer = function() {
    return server;
  };

  var configHost = lodash.get(mainCfg, 'host', '0.0.0.0');
  var configPort = lodash.get(mainCfg, 'port', 8080);

  this.start = function() {
    return new Promise(function(resolve, reject) {
      var serverInstance = server.listen(configPort, configHost, function () {
        var host = serverInstance.address().address;
        var port = serverInstance.address().port;
        chores.isVerboseForced(packageName, mainCfg) &&
        chores.logConsole('%s is listening at http://%s:%s', packageName, host, port);
        resolve(serverInstance);
      });
    });
  };

  this.stop = function() {
    return new Promise(function(resolve, reject) {
      server.close(function () {
        chores.isVerboseForced(packageName, mainCfg) &&
        chores.logConsole('%s has been closed', packageName);
        resolve();
      });
    });
  };
};

module.exports = Service;
