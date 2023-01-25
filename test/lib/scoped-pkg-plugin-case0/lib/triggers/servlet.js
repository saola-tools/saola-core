/* global Devebot */
"use strict";

const Promise = Devebot.require("bluebird");
const chores = Devebot.require("chores");
const lodash = Devebot.require("lodash");
const http = require("http");

function Service (params = {}) {
  const { componentId, packageName, loggingFactory, sandboxConfig, bridgeCase0Instance0, handler } = params;

  const L = loggingFactory.getLogger();
  const T = loggingFactory.getTracer();
  const blockRef = chores.getBlockRef(__filename, packageName);

  const self = this;
  const server = http.createServer();

  server.on("error", function(err) {
    L && L.has("silly") && L.log("silly", T && T.add({ blockRef }).toMessage({
      tags: [ blockRef ],
      text: "Server error: " + JSON.stringify(err)
    }));
  });

  server.on("request", function(req, res) {
    res.setHeader("Content-Type", "application/json");
    res.writeHead(200);
    res.end(JSON.stringify(lodash.assign({}, handler.getSampleData(), self.getSampleData()), null, 2));
  });

  this.getSampleData = function() {
    return {
      [componentId]: {
        blockRef: blockRef,
        bridges: {
          bridgeCase0Instance0: bridgeCase0Instance0.getConfig()
        }
      }
    };
  };

  const configHost = lodash.get(sandboxConfig, "host", "0.0.0.0");
  const configPort = lodash.get(sandboxConfig, "port", 8080);

  this.start = function() {
    return new Promise(function(resolve, reject) {
      const serverInstance = server.listen(configPort, configHost, function () {
        const host = serverInstance.address().address;
        const port = serverInstance.address().port;
        (sandboxConfig && sandboxConfig.verbose !== false) &&
        chores.logConsole("%s webserver is listening at http://%s:%s", packageName, host, port);
        resolve(serverInstance);
      });
    });
  };

  this.stop = function() {
    return new Promise(function(resolve, reject) {
      server.close(function () {
        (sandboxConfig && sandboxConfig.verbose !== false) &&
        chores.logConsole("%s webserver has been closed", packageName);
        resolve();
      });
    });
  };
};

Service.referenceHash = {
  handler: "handler",
  bridgeCase0Instance0: "@devebot/plugin-case0/bridgeCase0#default"
};

module.exports = Service;
