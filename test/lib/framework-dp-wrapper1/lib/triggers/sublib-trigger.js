"use strict";

const Promise = Devebot.require("bluebird");
const chores = Devebot.require("chores");
const lodash = Devebot.require("lodash");
const http = require("http");
const util = require("util");

const Service = function(params = {}) {
  const packageName = params.packageName || "devebot-dp-wrapper1";
  const blockRef = chores.getBlockRef(__filename, packageName);
  const L = params.loggingFactory.getLogger();
  const T = params.loggingFactory.getTracer();

  L.has("silly") && L.log("silly", T.toMessage({
    tags: [blockRef, "constructor-begin"],
    text: " + constructor begin ..."
  }));

  if (chores.isUpgradeSupported("bridge-full-ref")) {
    const connector1 = params["connector1#bean"];
    L.has("silly") && L.log("silly", T.add({
      config: connector1.getConfig()
    }).toMessage({
      tags: [blockRef, "connector1#bean", "bridge-config"],
      text: " - connector1#bean.config: ${config}"
    }));

    const connector2 = params["connector2#bean"];
    L.has("silly") && L.log("silly", T.add({
      config: connector2.getConfig()
    }).toMessage({
      tags: [blockRef, "connector2#bean", "bridge-config"],
      text: " - connector2#bean.config: ${config}"
    }));
  }

  const pluginCfg = lodash.get(params, ["sandboxConfig"], {});

  this.getConfig = function() {
    return pluginCfg;
  };

  const server = http.createServer();

  server.on("error", function(err) {
    L.has("silly") && L.log("silly", T.add({
      error: err
    }).toMessage({
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

  const configHost = lodash.get(pluginCfg, "host", "0.0.0.0");
  const configPort = lodash.get(pluginCfg, "port", 8080);

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

  L.has("silly") && L.log("silly", T.toMessage({
    tags: [blockRef, "constructor-end"],
    text: " + constructor end!"
  }));
};

Service.referenceList = [
  "bridgeKebabCase1#pointer",
  "bridgeKebabCase2#pointer",
  "connector1#bean",
  "connector2#bean"
];

if (!chores.isUpgradeSupported("bridge-full-ref")) {
  Service.referenceList = [];
};

module.exports = Service;
