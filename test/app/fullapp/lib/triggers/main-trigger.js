"use strict";

const http = require("http");
const Promise = Devebot.require("bluebird");
const chores = Devebot.require("chores");
const lodash = Devebot.require("lodash");

const Service = function(params={}) {
  const sandboxConfig = lodash.get(params, ["sandboxConfig", "application"], {});

  const { packageName, loggingFactory, mainService } = params;

  const L = loggingFactory && loggingFactory.getLogger();
  const T = loggingFactory && loggingFactory.getTracer();
  const blockRef = chores.getBlockRef(__filename, packageName);

  const self = this;
  const server = http.createServer();

  server.on("error", function(err) {
    L && L.has("silly") && L.log("silly", T && T.add({ blockRef }).toMessage({
      tags: [ blockRef, "http-server-error" ],
      text: "Server error: " + JSON.stringify(err)
    }));
  });

  server.on("request", function(req, res) {
    res.writeHead(200, {
      "Content-Type": "application/json"
    });
    res.end(JSON.stringify({
      packageName: packageName,
      config: self.getConfig(),
    }, null, 2));
  });

  this.getServer = function() {
    return server;
  };

  this.getConfig = function() {
    return lodash.assign(mainService && mainService.getConfig() || {}, {
      [blockRef]: sandboxConfig
    });
  };

  const configHost = lodash.get(sandboxConfig, "host", "0.0.0.0");
  const configPort = lodash.get(sandboxConfig, "port", 8080);

  this.start = function() {
    return new Promise(function(resolve, reject) {
      const serverInstance = server.listen(configPort, configHost, function () {
        const host = serverInstance.address().address;
        const port = serverInstance.address().port;
        chores.isVerboseForced(packageName, sandboxConfig) &&
        chores.logConsole("%s is listening at http://%s:%s", packageName, host, port);
        resolve(serverInstance);
      });
    });
  };

  this.stop = function() {
    return new Promise(function(resolve, reject) {
      server.close(function () {
        chores.isVerboseForced(packageName, sandboxConfig) &&
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
