/* global Devebot */
"use strict";

const Promise = Devebot.require("bluebird");
const lodash = Devebot.require("lodash");
const chores = Devebot.require("chores");
const devlog = Devebot.require("pinbug")("devebot:test:lab:main:mainTrigger");
const http = require("http");
const util = require("util");

const Service = function(params = {}) {
  devlog.enabled && devlog(" + constructor begin ...");

  const L = params.loggingFactory.getLogger();
  const T = params.loggingFactory.getTracer();
  const packageName = params.packageName;

  const sandboxConfig = lodash.get(params, ["sandboxConfig", "application"], {});

  const server = http.createServer();

  server.on("error", function(err) {
    devlog.enabled && devlog("Server Error: %s", JSON.stringify(err));
  });

  server.on("request", function(req, res) {
    res.writeHead(200);
    res.end(util.format("%s webserver", packageName));
  });

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

  devlog.enabled && devlog(" - constructor end!");
};

module.exports = Service;
