'use strict';

var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');
var debugx = Devebot.require('pinbug')('devebot:test:lab:sub-plugin2:sublibTrigger');
var http = require('http');

var Service = function(params) {
  var self = this;
  params = params || {};

  debugx.enabled && debugx(' + constructor begin ...');

  var pluginCfg = lodash.get(params, ['sandboxConfig'], {});

  var server = http.createServer();

  server.on('error', function(err) {
    debugx.enabled && debugx('Server Error: %s', JSON.stringify(err));
  });

  server.on('request', function(req, res) {
    res.writeHead(200);
    res.end('sub-plugin2 webserver');
  });

  self.getServer = function() {
    return server;
  };

  var configHost = lodash.get(pluginCfg, 'host', '0.0.0.0');
  var configPort = lodash.get(pluginCfg, 'port', 8080);

  self.start = function() {
    return new Promise(function(resolved, rejected) {
      var serverInstance = server.listen(configPort, configHost, function () {
        var host = serverInstance.address().address;
        var port = serverInstance.address().port;
        (pluginCfg && pluginCfg.verbose !== false || debugx.enabled) &&
        console.log('sub-plugin2 webserver is listening at http://%s:%s', host, port);
        resolved(serverInstance);
      });
    });
  };

  self.stop = function() {
    return new Promise(function(resolved, rejected) {
      server.close(function () {
        (pluginCfg && pluginCfg.verbose !== false || debugx.enabled) &&
        console.log('sub-plugin2 webserver has been closed');
        resolved();
      });
    });
  };

  debugx.enabled && debugx(' - constructor end!');
};

module.exports = Service;
