'use strict';

var Promise = Devebot.require('bluebird');
var chores = Devebot.require('chores');
var lodash = Devebot.require('lodash');
var http = require('http');

var Service = function(params) {
  var self = this;
  params = params || {};

  var packageName = params.packageName || 'plugin-invalid-trigger-methods';
  var blockRef = chores.getBlockRef(__filename, packageName);
  var LX = params.loggingFactory.getLogger();
  var LT = params.loggingFactory.getTracer();

  LX.has('conlog') && LX.log('conlog', LT.toMessage({
    tags: [ blockRef, 'constructor-begin' ],
    text: ' + constructor begin'
  }));

  var pluginCfg = lodash.get(params, 'sandboxConfig', {});

  var server = http.createServer();

  server.on('error', function(err) {
    LX.has('error') && LX.log('error', LT.add({
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
    tags: [ blockRef, 'constructor-end' ],
    text: ' - constructor end!'
  }));
};

module.exports = Service;