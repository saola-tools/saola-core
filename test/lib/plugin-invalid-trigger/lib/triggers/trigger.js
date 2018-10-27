'use strict';

var Promise = Devebot.require('bluebird');
var chores = Devebot.require('chores');
var lodash = Devebot.require('lodash');
var http = require('http');

var Service = function(params) {
  var self = this;
  params = params || {};

  var packageName = params.packageName || 'plugin-invalid-trigger';
  var blockRef = chores.getBlockRef(__filename, packageName);
  var L = params.loggingFactory.getLogger();
  var T = params.loggingFactory.getTracer();

  L.has('conlog') && L.log('conlog', T.toMessage({
    tags: [ blockRef, 'constructor-begin' ],
    text: ' + constructor begin'
  }));

  var pluginCfg = lodash.get(params, 'sandboxConfig', {});

  var server = http.createServer();

  server.on('error', function(err) {
    L.has('error') && L.log('error', T.add({
      error: err
    }).toMessage({
      tags: [ blockRef, 'server-error' ],
      text: ' - Server Error: {error}',
      reset: true
    }));
  });

  server.on('request', function(req, res) {
    res.writeHead(200);
    res.end('plugin-invalid-trigger webserver');
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

  unknownVar2 = 'will be failed';

  L.has('conlog') && L.log('conlog', T.toMessage({
    tags: [ blockRef, 'constructor-end' ],
    text: ' - constructor end!'
  }));
};

module.exports = Service;
