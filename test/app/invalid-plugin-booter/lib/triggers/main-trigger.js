'use strict';

var http = require('http');
var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');
var chores = Devebot.require('chores');
var debugx = Devebot.require('pinbug')('devebot:test:lab:main:mainTrigger');

const MODULE_NAME = 'invalid-plugin-booter/mainTrigger';

var Service = function(params) {
  debugx.enabled && debugx(' + constructor begin ...');

  params = params || {};
  params.packageName = params.packageName || 'invalid-plugin-booter';

  var L = params.loggingFactory.getLogger();

  var mainCfg = lodash.get(params, 'sandboxConfig', {});

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
    return new Promise(function(resolved, rejected) {
      var serverInstance = server.listen(configPort, configHost, function () {
        var host = serverInstance.address().address;
        var port = serverInstance.address().port;
        chores.isVerboseForced(params.packageName, mainCfg) &&
        console.log('%s#webserver is listening at http://%s:%s', params.packageName, host, port);
        resolved(serverInstance);
      });
    });
  };

  this.stop = function() {
    return new Promise(function(resolved, rejected) {
      server.close(function () {
        chores.isVerboseForced('invalid-plugin-service', mainCfg) &&
        console.log('%s#webserver has been closed', params.packageName);
        resolved();
      });
    });
  };

  debugx.enabled && debugx(' - constructor end!');
};

MODULE_NAME = 'unknown';

module.exports = Service;
