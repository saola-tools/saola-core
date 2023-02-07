"use strict";

const http = require("http");
const Promise = Devebot.require("bluebird");
const lodash = Devebot.require("lodash");
const chores = Devebot.require("chores");
const debugx = Devebot.require("pinbug")("test:app:setting-with-metadata:mainTrigger");

const Service = function(params={}) {
  const packageName = params.packageName || "setting-with-metadata";
  const mainCfg = params.sandboxConfig || {};

  chores.logConsole("External merge config: ", params.mainService.mergeConfig({
    reqId: chores.getUUID()
  }));

  const server = http.createServer();

  server.on("error", function(err) {
    debugx.enabled && debugx("Server Error: %s", JSON.stringify(err));
  });

  this.getServer = function() {
    return server;
  };

  const configHost = lodash.get(mainCfg, ["server", "host"], "0.0.0.0");
  const configPort = lodash.get(mainCfg, ["server", "port"], 8080);

  this.start = function() {
    return new Promise(function(resolve, reject) {
      const serverInstance = server.listen(configPort, configHost, function () {
        const host = serverInstance.address().address;
        const port = serverInstance.address().port;
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

Service.referenceHash = {
  "dialect": "application/bridge4#instance",
  "mainService": "application/mainService"
};

module.exports = Service;
