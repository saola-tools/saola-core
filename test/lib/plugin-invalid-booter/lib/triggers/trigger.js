'use strict';

var Promise = Devebot.require('bluebird');
var chores = Devebot.require('chores');
var lodash = Devebot.require('lodash');
var http = require('http');

const MODULE_NAME = 'plugin-invalid-booter/trigger';

var Service = function(params) {
  var self = this;
  params = params || {};
  params.packageName = params.packageName || 'plugin-invalid-booter';

  var LX = params.loggingFactory.getLogger();
  var LT = params.loggingFactory.getTracer();

  LX.has('conlog') && LX.log('conlog', LT.toMessage({
    tags: [ 'plugin-invalid-service', 'constructor-begin' ],
    text: ' + constructor begin'
  }));

  var pluginCfg = lodash.get(params, 'sandboxConfig', {});

  var server = http.createServer();

  server.on('error', function(err) {
    LX.has('error') && LX.log('error', LT.add({
      error: err
    }).toMessage({
      tags: [ 'plugin-invalid-service', 'server-error' ],
      text: ' - Server Error: {error}',
      reset: true
    }));
  });

  server.on('request', function(req, res) {
    res.writeHead(200);
    res.end('plugin-invalid-service webserver');
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
        chores.isVerboseForced(params.packageName, pluginCfg) &&
        console.log('%s#webserver is listening at http://%s:%s', params.packageName, host, port);
        resolved(serverInstance);
      });
    });
  };

  self.stop = function() {
    return new Promise(function(resolved, rejected) {
      server.close(function () {
        chores.isVerboseForced(params.packageName, pluginCfg) &&
        console.log('%s#webserver has been closed', params.packageName);
        resolved();
      });
    });
  };

  LX.has('conlog') && LX.log('conlog', LT.toMessage({
    tags: [ 'plugin-invalid-service', 'constructor-end' ],
    text: ' - constructor end!'
  }));
};

MODULE_NAME = 'UNKNOWN';

module.exports = Service;
