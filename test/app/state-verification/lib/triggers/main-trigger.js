/* global Devebot */
"use strict";

const Promise = Devebot.require("bluebird");
const chores = Devebot.require("chores");
const lodash = Devebot.require("lodash");
const http = require("http");
const util = require("util");

const Service = function(params={}) {
  const L = params.loggingFactory.getLogger();
  const T = params.loggingFactory.getTracer();
  const packageName = params.packageName || "state-verification";
  const blockRef = params.componentId;
  const mainCfg = lodash.get(params, ["sandboxConfig"], {});

  this.getConfig = function() {
    return lodash.cloneDeep(mainCfg);
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

  const configHost = lodash.get(mainCfg, "host", "0.0.0.0");
  const configPort = lodash.get(mainCfg, "port", 8080);

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

if (chores.isUpgradeSupported("bridge-full-ref")) {
  Service.referenceList = [
    chores.toFullname("application", "connector1#wrapper"),
    chores.toFullname("application", "connector2#wrapper"),
    chores.toFullname("devebot-dp-wrapper1", "sublibTrigger"),
    chores.toFullname("devebot-dp-wrapper2", "sublibTrigger")
  ];
}

module.exports = Service;
