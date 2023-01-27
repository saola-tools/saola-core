/* global Devebot */
"use strict";

var Promise = Devebot.require("bluebird");
var chores = Devebot.require("chores");
var lodash = Devebot.require("lodash");
var http = require("http");
var util = require("util");

var Service = function(params) {
  params = params || {};

  var L = params.loggingFactory.getLogger();
  var T = params.loggingFactory.getTracer();

  var packageName = params.packageName || "sub-plugin4";
  var blockRef = chores.getBlockRef(__filename, packageName);
  var pluginCfg = lodash.get(params, ["sandboxConfig"], {});

  this.getConfig = function() {
    return pluginCfg;
  };

  var server = http.createServer();

  server.on("error", function(err) {
    L.has("silly") && L.log("silly", T.add({ error: err }).toMessage({
      tags: [blockRef, "webserver-error"],
      text: "Server Error: ${error}"
    }));
  });

  server.on("request", function(req, res) {
    res.writeHead(200);
    res.end(util.format("%s webserver", packageName));
  });

  this.getServer = function() {
    return server;
  };

  var configHost = lodash.get(pluginCfg, ["mongodb", "host"], "0.0.0.0");
  var configPort = lodash.get(pluginCfg, ["mongodb", "port"], 8080);

  this.start = function() {
    return new Promise(function(resolve, reject) {
      var serverInstance = server.listen(configPort, configHost, function () {
        var host = serverInstance.address().address;
        var port = serverInstance.address().port;
        if (chores.isVerboseForced(packageName, pluginCfg)) {
          chores.logConsole("%s webserver is listening at http://%s:%s", packageName, host, port);
        }
        resolve(serverInstance);
      });
    });
  };

  this.stop = function() {
    return new Promise(function(resolve, reject) {
      server.close(function () {
        if (chores.isVerboseForced(packageName, pluginCfg)) {
          chores.logConsole("%s webserver has been closed", packageName);
        }
        resolve();
      });
    });
  };
};

module.exports = Service;
