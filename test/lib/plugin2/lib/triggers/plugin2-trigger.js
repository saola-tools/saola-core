'use strict';

var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');
var chores = Devebot.require('chores');
var http = require('http');
var util = require('util');

var Service = function(params) {
  var self = this;
  params = params || {};

  var LX = params.loggingFactory.getLogger();
  var LT = params.loggingFactory.getTracer();

  var packageName = params.packageName || 'plugin2';
  var blockRef = params.componentId;
  var pluginCfg = params.sandboxConfig || {};

  var server = http.createServer();

  server.on('error', function(error) {
    LX.has('error') && LX.log('error', LT.add({ error: error }).toMessage({
      tags: [ blockRef, 'server-error' ],
      text: ' - Server Error: {error}'
    }));
  });

  server.on('request', function(req, res) {
    res.writeHead(200);
    res.end(util.format('%s webserver', packageName));
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
        chores.isVerboseForced(packageName, pluginCfg) &&
            console.log('%s webserver is listening at http://%s:%s', packageName, host, port);
        resolved(serverInstance);
      });
    });
  };

  self.stop = function() {
    return new Promise(function(resolved, rejected) {
      server.close(function () {
        chores.isVerboseForced(packageName, pluginCfg) &&
            console.log('%s webserver has been closed', packageName);
        resolved();
      });
    });
  };
};

Service.argumentSchema = {
  "$id": "plugin2Trigger",
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
