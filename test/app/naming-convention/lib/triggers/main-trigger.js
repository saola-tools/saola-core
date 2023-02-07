"use strict";

const http = require("http");
const Promise = FRWK.require("bluebird");
const chores = FRWK.require("chores");
const lodash = FRWK.require("lodash");

const Service = function(params) {
  params = params || {};

  const packageName = params.packageName || "naming-convention";
  const blockRef = chores.getBlockRef(__filename, packageName);
  const L = params.loggingFactory.getLogger();
  const T = params.loggingFactory.getTracer();

  const mainCfg = lodash.get(params, ["sandboxConfig"], {});

  this.getConfig = function() {
    return lodash.cloneDeep(mainCfg);
  };

  const server = http.createServer();

  server.on("error", function(err) {
    L && L.has("silly") && L.log("silly", T && T.add({ blockRef }).toMessage({
      tags: [ blockRef ],
      text: "Server error: " + JSON.stringify(err)
    }));
  });

  server.on("request", function(req, res) {
    res.writeHead(200);
    res.end("naming-convention webserver");
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
