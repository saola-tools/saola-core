"use strict";

const Promise = FRWK.require("bluebird");
const chores = FRWK.require("chores");
const lodash = FRWK.require("lodash");
const http = require("http");

const Service = function(params = {}) {
  const { packageName, loggingFactory, sandboxConfig } = params;

  const L = loggingFactory.getLogger();
  const T = loggingFactory.getTracer();
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

  this.getConfig = function() {
    return lodash.assign({}, {
      [blockRef]: sandboxConfig
    });
  };

  this.getServer = function() {
    return server;
  };

  const configHost = lodash.get(sandboxConfig, "host", "0.0.0.0");
  const configPort = lodash.get(sandboxConfig, "port", 8080);

  this.start = function() {
    return new Promise(function(resolve, reject) {
      const serverInstance = server.listen(configPort, configHost, function () {
        const host = serverInstance.address().address;
        const port = serverInstance.address().port;
        chores.isVerboseForced(packageName, sandboxConfig) &&
        chores.logConsole("%s webserver is listening at http://%s:%s", packageName, host, port);
        resolve(serverInstance);
      });
    });
  };

  this.stop = function() {
    return new Promise(function(resolve, reject) {
      server.close(function () {
        chores.isVerboseForced(packageName, sandboxConfig) &&
        chores.logConsole("%s webserver has been closed", packageName);
        resolve();
      });
    });
  };
};

module.exports = Service;
