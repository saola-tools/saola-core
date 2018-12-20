'use strict';

var Promise = Devebot.require('bluebird');
var chores = Devebot.require('chores');
var lodash = Devebot.require('lodash');
var http = require('http');

const MODULE_NAME = 'plugin-invalid-booter/trigger';

var Service = function(params) {
  params = params || {};

  var packageName = params.packageName || 'plugin-invalid-booter';
  var blockRef = chores.getBlockRef(__filename, packageName);
  var L = params.loggingFactory.getLogger();
  var T = params.loggingFactory.getTracer();

  L.has('dunce') && L.log('dunce', T.toMessage({
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
    res.end('plugin-invalid-service webserver');
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
        chores.isVerboseForced(packageName, pluginCfg) &&
        console.log('%s#webserver is listening at http://%s:%s', packageName, host, port);
        resolved(serverInstance);
      });
    });
  };

  this.stop = function() {
    return new Promise(function(resolved, rejected) {
      server.close(function () {
        chores.isVerboseForced(packageName, pluginCfg) &&
        console.log('%s#webserver has been closed', packageName);
        resolved();
      });
    });
  };

  L.has('dunce') && L.log('dunce', T.toMessage({
    tags: [ blockRef, 'constructor-end' ],
    text: ' - constructor end!'
  }));
};

MODULE_NAME = 'UNKNOWN';

module.exports = Service;
