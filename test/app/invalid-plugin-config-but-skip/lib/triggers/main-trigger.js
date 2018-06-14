'use strict';

var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');
var chores = Devebot.require('chores');
var debugx = Devebot.require('pinbug')('devebot:test:lab:main:mainTrigger');
var http = require('http');
var util = require('util');

var Service = function(params) {
  debugx.enabled && debugx(' + constructor begin ...');

  params = params || {};

  var self = this;

  var LX = params.loggingFactory.getLogger();
  var LT = params.loggingFactory.getTracer();
  var packageName = params.packageName;

  var mainCfg = lodash.get(params, ['sandboxConfig', 'application'], {});

  var server = http.createServer();

  server.on('error', function(err) {
    debugx.enabled && debugx('Server Error: %s', JSON.stringify(err));
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

  debugx.enabled && debugx(' - constructor end!');
};

module.exports = Service;
