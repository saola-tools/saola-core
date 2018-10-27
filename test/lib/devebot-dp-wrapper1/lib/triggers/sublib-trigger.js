'use strict';

var Promise = Devebot.require('bluebird');
var chores = Devebot.require('chores');
var lodash = Devebot.require('lodash');
var http = require('http');

var Service = function(params) {
  params = params || {};

  var packageName = params.packageName || 'devebot-dp-wrapper1';
  var blockRef = chores.getBlockRef(__filename, packageName);
  var L = params.loggingFactory.getLogger();
  var T = params.loggingFactory.getTracer();

  L.has('silly') && L.log('silly', T.toMessage({
    tags: [blockRef, 'constructor-begin'],
    text: ' + constructor begin ...'
  }));

  if (chores.isUpgradeSupported('bridge-full-ref')) {
    var connector1 = params["connector1#bean"];
    L.has('silly') && L.log('silly', T.add({
      config: connector1.getConfig()
    }).toMessage({
      tags: [blockRef, 'connector1#bean', 'bridge-config'],
      text: ' - connector1#bean.config: ${config}'
    }));

    var connector2 = params["connector2#bean"];
    L.has('silly') && L.log('silly', T.add({
      config: connector2.getConfig()
    }).toMessage({
      tags: [blockRef, 'connector2#bean', 'bridge-config'],
      text: ' - connector2#bean.config: ${config}'
    }));
  }

  var pluginCfg = lodash.get(params, ['sandboxConfig'], {});

  this.getConfig = function() {
    return pluginCfg;
  }

  var server = http.createServer();

  server.on('error', function(err) {
    L.has('silly') && L.log('silly', T.add({
      error: err
    }).toMessage({
      tags: [blockRef, 'webserver-error'],
      text: 'Server Error: ${error}'
    }));
  });

  server.on('request', function(req, res) {
    res.writeHead(200);
    res.end(util.format('%s webserver', packageName));
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
        if (chores.isVerboseForced(packageName, pluginCfg)) {
          console.log('%s webserver is listening at http://%s:%s', packageName, host, port);
        }
        resolved(serverInstance);
      });
    });
  };

  this.stop = function() {
    return new Promise(function(resolved, rejected) {
      server.close(function () {
        if (chores.isVerboseForced(packageName, pluginCfg)) {
          console.log('%s webserver has been closed', packageName);
        }
        resolved();
      });
    });
  };

  L.has('silly') && L.log('silly', T.toMessage({
    tags: [blockRef, 'constructor-end'],
    text: ' + constructor end!'
  }));
};

Service.referenceList = [
  "bridgeKebabCase1#pointer",
  "bridgeKebabCase2#pointer",
  "connector1#bean",
  "connector2#bean"
];

if (!chores.isUpgradeSupported('bridge-full-ref')) {
  Service.referenceList = [];
};

module.exports = Service;
