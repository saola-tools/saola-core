'use strict';

var http = require('http');
var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');
var chores = Devebot.require('chores');
var debugx = Devebot.require('pinbug')('devebot:test:lab:main:mainTrigger');

var Service = function(params) {
  debugx.enabled && debugx(' + constructor begin ...');

  params = params || {};

  var self = this;

  var logger = params.loggingFactory.getLogger();

  var pluginName = 'invalid-plugin-trigger'; //Service.argumentSchema.$id;
  var mainCfg = lodash.get(params, ['sandboxConfig'], {});

  var server = http.createServer();

  server.on('error', function(err) {
    debugx.enabled && debugx('Server Error: %s', JSON.stringify(err));
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
        chores.isVerboseForced(pluginName, mainCfg) &&
        console.log('%s#webserver is listening at http://%s:%s', pluginName, host, port);
        resolved(serverInstance);
      });
    });
  };

  self.stop = function() {
    return new Promise(function(resolved, rejected) {
      server.close(function () {
        chores.isVerboseForced('invalid-plugin-trigger', mainCfg) &&
        console.log('%s#webserver has been closed', pluginName);
        resolved();
      });
    });
  };

  debugx.enabled && debugx(' - constructor end!');
};

module.exports = Service;