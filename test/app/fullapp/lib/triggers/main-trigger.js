/* global Devebot */
"use strict";

var http = require("http");
var Promise = Devebot.require("bluebird");
var chores = Devebot.require("chores");
var lodash = Devebot.require("lodash");
var debugx = Devebot.require("pinbug")("devebot:test:lab:main:mainTrigger");

var Service = function(params={}) {
  var packageName = params.packageName || "fullapp";
  var mainCfg = lodash.get(params, ["sandboxConfig", "application"], {});

  var server = http.createServer();

  server.on("error", function(err) {
    debugx.enabled && debugx("Server Error: %s", JSON.stringify(err));
  });

  server.on("request", function(req, res) {
    res.writeHead(200);
    res.end("fullapp webserver");
  });

  this.getServer = function() {
    return server;
  };

  var configHost = lodash.get(mainCfg, "host", "0.0.0.0");
  var configPort = lodash.get(mainCfg, "port", 8080);

  this.start = function() {
    return new Promise(function(resolve, reject) {
      var serverInstance = server.listen(configPort, configHost, function () {
        var host = serverInstance.address().address;
        var port = serverInstance.address().port;
        chores.isVerboseForced(packageName, mainCfg) &&
        chores.logConsole("%s is listening at http://%s:%s", packageName, host, port);
        resolve(serverInstance);
      });
    });
  };

  this.stop = function() {
    return new Promise(function(resolve, reject) {
      server.close(function () {
        chores.isVerboseForced(packageName, mainCfg) &&
        chores.logConsole("%s has been closed", packageName);
        resolve();
      });
    });
  };
};

if (chores.isUpgradeSupported("bridge-full-ref")) {
  Service.referenceList = [
    chores.toFullname("application", "bridge1#anyname1z"),
    chores.toFullname("application", "bridge2#anyname2z"),
    chores.toFullname("connector1#wrapper"),
    chores.toFullname("connector2#wrapper"),
    chores.toFullname("plugin2", "bridge1#anyname1b"),
    chores.toFullname("plugin2", "bridge2#anyname2b")
  ];
}

module.exports = Service;
