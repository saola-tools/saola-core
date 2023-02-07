"use strict";

const Promise = Devebot.require("bluebird");
const chores = Devebot.require("chores");
const lodash = Devebot.require("lodash");
const http = require("http");
const util = require("util");

const Service = function(params) {
  params = params || {};

  const L = params.loggingFactory.getLogger();
  const T = params.loggingFactory.getTracer();

  const packageName = params.packageName || "sub-plugin3";
  const blockRef = chores.getBlockRef(__filename, packageName);
  const pluginCfg = lodash.get(params, ["sandboxConfig"], {});

  this.getConfig = function() {
    return pluginCfg;
  };

  const server = http.createServer();

  server.on("error", function(error) {
    L.has("silly") && L.log("silly", T.add({ error: error }).toMessage({
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

  const configHost = lodash.get(pluginCfg, ["couchdb", "host"], "0.0.0.0");
  const configPort = lodash.get(pluginCfg, ["couchdb", "port"], 8080);

  this.start = function() {
    return new Promise(function(resolve, reject) {
      const serverInstance = server.listen(configPort, configHost, function () {
        const host = serverInstance.address().address;
        const port = serverInstance.address().port;
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
