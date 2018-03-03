'use strict';

var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');
var chores = Devebot.require('chores');
var http = require('http');

var Service = function(params) {
  var self = this;
  params = params || {};

  var LX = params.loggingFactory.getLogger();
  var LT = params.loggingFactory.getTracer();

  LX.has('conlog') && LX.log('conlog', LT.toMessage({
    tags: [ 'test-plugin2', 'constructor-begin' ],
    text: ' + constructor begin'
  }));

  self.logger = params.loggingFactory.getLogger();

  var pluginCfg = lodash.get(params, ['sandboxConfig'], {});

  var server = http.createServer();

  server.on('error', function(err) {
    LX.has('error') && LX.log('error', LT.add({
      error: err
    }).toMessage({
      tags: [ 'test-plugin2', 'server-error' ],
      text: ' - Server Error: {error}',
      reset: true
    }));
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
        (pluginCfg && pluginCfg.verbose !== false || chores.isVerboseForced('plugin2')) &&
        console.log('plugin2 webserver is listening at http://%s:%s', host, port);
        resolved(serverInstance);
      });
    });
  };

  self.stop = function() {
    return new Promise(function(resolved, rejected) {
      server.close(function () {
        (pluginCfg && pluginCfg.verbose !== false || chores.isVerboseForced('plugin2')) &&
        console.log('plugin2 webserver has been closed');
        resolved();
      });
    });
  };

  LX.has('conlog') && LX.log('conlog', LT.toMessage({
    tags: [ 'test-plugin2', 'constructor-end' ],
    text: ' - constructor end!'
  }));
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
