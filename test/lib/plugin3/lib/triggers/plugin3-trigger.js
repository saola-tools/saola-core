'use strict';

var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');
var http = require('http');
var debugx = Devebot.require('pinbug')('devebot:test:lab:plugin3:plugin3Trigger');

var Service = function(params) {
  params = params || {};

  var L = params.loggingFactory.getLogger();
  var T = params.loggingFactory.getTracer();
  var packageName = params.packageName || 'plugin3';

  var pluginCfg = lodash.get(params, ['sandboxConfig', 'plugins', 'plugin3'], {});

  var server = http.createServer();

  server.on('error', function(error) {
    L.has('error') && L.log('error', T.add({ error }).toMessage({
      tags: [ packageName, 'server-error' ],
      text: ' - Server Error: {error}',
      reset: true
    }));
  });

  server.on('request', function(req, res) {
    res.writeHead(200);
    res.end('plugin3 webserver');
  });

  this.getServer = function() {
    return server;
  };

  var configHost = lodash.get(pluginCfg, 'host', '0.0.0.0');
  var configPort = lodash.get(pluginCfg, 'port', 8080);

  this.start = function() {
    return new Promise(function(resolved, rejected) {
      var serverInstance = server.listen(configPort, configHost, function () {
        var host = serverInstance.address().address;
        var port = serverInstance.address().port;
        (pluginCfg && pluginCfg.verbose !== false || debugx.enabled) &&
        console.log('%s webserver is listening at http://%s:%s', packageName, host, port);
        resolved(serverInstance);
      });
    });
  };

  this.stop = function() {
    return new Promise(function(resolved, rejected) {
      server.close(function () {
        (pluginCfg && pluginCfg.verbose !== false || debugx.enabled) &&
        console.log('%s webserver has been closed', packageName);
        resolved();
      });
    });
  };
};

Service.argumentSchema = {
  "$id": "plugin3Trigger",
  "type": "object",
  "properties": {
    "sandboxName": {
      "type": "string"
    },
    "sandboxConfig": {
      "type": "object"
    },
    "profileConfig": {
      "type": "object"
    },
    "loggingFactory": {
      "type": "object"
    }
  }
};

module.exports = Service;
